import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import schema from "../convex/schema";

type Validator = {
  kind: string;
  isOptional?: string;
  tableName?: string;
  value?: unknown;
  members?: Validator[];
  element?: Validator;
  fields?: Record<string, Validator>;
};
type TableDefinition = { validator: { fields: Record<string, Validator> } };
type SnapshotDocument = Record<string, unknown> & { _id?: unknown; _creationTime?: unknown };
type Issue = { table: string; line?: number; code: string; message: string };
type TableResult = { table: string; records: number; valid: number; issues: number; unresolvedReferences: number };
export type SnapshotValidationReport = {
  mode: "dry-run";
  sourceTables: number;
  tableFiles: number;
  records: number;
  validRecords: number;
  issueCount: number;
  unresolvedReferenceCount: number;
  tables: TableResult[];
  issues: Issue[];
};

const definitions = schema.tables as unknown as Record<string, TableDefinition>;
const tableNames = Object.keys(definitions).sort();

function isJsonValue(value: unknown): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).every(isJsonValue);
  return false;
}

function conforms(value: unknown, validator: Validator): boolean {
  if (validator.isOptional === "optional" && value === undefined) return true;
  switch (validator.kind) {
    case "string": return typeof value === "string";
    case "float64": return typeof value === "number" && Number.isFinite(value);
    case "boolean": return typeof value === "boolean";
    case "null": return value === null;
    case "any": return isJsonValue(value);
    case "id": return typeof value === "string" && value.length > 0;
    case "literal": return value === validator.value;
    case "array": return Array.isArray(value) && value.every((item) => conforms(item, validator.element!));
    case "object": {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const object = value as Record<string, unknown>;
      return Object.entries(validator.fields || {}).every(([key, field]) => conforms(object[key], field))
        && Object.keys(object).every((key) => Object.hasOwn(validator.fields || {}, key));
    }
    case "union": return (validator.members || []).some((member) => conforms(value, member));
    default: return false;
  }
}

function scalarIdTarget(validator: Validator): string | undefined {
  if (validator.kind === "id") return validator.tableName;
  if (validator.kind === "union") {
    const members = (validator.members || []).filter((member) => member.kind !== "null");
    if (members.length === 1 && members[0].kind === "id") return members[0].tableName;
  }
  return undefined;
}

export function countUnresolvedReferences(value: unknown, validator: Validator): number {
  if (value === undefined || value === null) return 0;
  if (validator.kind === "id") return validator.tableName === "_storage" && typeof value === "string" ? 1 : 0;
  if (validator.kind === "array" && Array.isArray(value)) {
    if (validator.element?.kind === "id") return validator.element.tableName === "_storage" ? value.filter((item) => typeof item === "string").length : value.length;
    return value.reduce((total, item) => total + countUnresolvedReferences(item, validator.element!), 0);
  }
  if (validator.kind === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(validator.fields || {}).reduce((total, [key, field]) =>
      total + countUnresolvedReferences((value as Record<string, unknown>)[key], field), 0);
  }
  if (validator.kind === "union") {
    const members = validator.members || [];
    if (typeof value === "string" && members.some((member) => member.kind === "id") && members.some((member) => member.kind === "string")) return 1;
    const member = members.find((item) => item.kind !== "null" && conforms(value, item));
    return member ? countUnresolvedReferences(value, member) : 0;
  }
  return 0;
}

/** Read-only validator for Convex CLI snapshot directories: <table>/documents.jsonl. */
export function validateSnapshotDirectory(snapshotDir: string): SnapshotValidationReport {
  const root = resolve(snapshotDir);
  if (!existsSync(root) || !statSync(root).isDirectory()) throw new Error("Snapshot directory does not exist or is not a directory");

  const issues: Issue[] = [];
  const tableResults: TableResult[] = [];
  const idsByTable = new Map<string, Set<string>>();
  const documentsByTable = new Map<string, Array<{ document: SnapshotDocument; line: number }>>();
  let tableFiles = 0;
  let records = 0;
  let unresolvedReferenceCount = 0;

  for (const table of tableNames) {
    const file = join(root, table, "documents.jsonl");
    const tableIssuesStart = issues.length;
    const entries: Array<{ document: SnapshotDocument; line: number }> = [];
    const ids = new Set<string>();
    let tableRecordCount = 0;
    let tableUnresolvedReferences = 0;
    idsByTable.set(table, ids);
    documentsByTable.set(table, entries);
    if (!existsSync(file)) {
      issues.push({ table, code: "missing_table_file", message: `Missing ${table}/documents.jsonl` });
      tableResults.push({ table, records: 0, valid: 0, issues: 1, unresolvedReferences: 0 });
      continue;
    }
    tableFiles += 1;
    let text: string;
    try { text = readFileSync(file, "utf8"); }
    catch { issues.push({ table, code: "unreadable_table_file", message: `Cannot read ${table}/documents.jsonl` }); continue; }
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const sourceLine = lines[index].trim();
      if (!sourceLine) continue;
      records += 1;
      tableRecordCount += 1;
      const line = index + 1;
      let document: SnapshotDocument;
      try {
        const parsed: unknown = JSON.parse(sourceLine);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
        document = parsed as SnapshotDocument;
      } catch {
        issues.push({ table, line, code: "invalid_json", message: "Line is not a JSON object" });
        continue;
      }
      if (typeof document._id !== "string" || !document._id) {
        issues.push({ table, line, code: "invalid_id", message: "Document requires a non-empty string _id" });
      } else if (ids.has(document._id)) {
        issues.push({ table, line, code: "duplicate_id", message: "Duplicate _id in snapshot table" });
      } else {
        ids.add(document._id);
      }
      if (typeof document._creationTime !== "number" || !Number.isFinite(document._creationTime)) {
        issues.push({ table, line, code: "invalid_creation_time", message: "Document requires finite numeric _creationTime" });
      }
      const fields = definitions[table].validator.fields;
      for (const key of Object.keys(document)) {
        if (key !== "_id" && key !== "_creationTime" && !Object.hasOwn(fields, key)) {
          issues.push({ table, line, code: "unknown_field", message: `Unknown field ${key}` });
        }
      }
      for (const [field, validator] of Object.entries(fields)) {
        if (!conforms(document[field], validator)) {
          issues.push({ table, line, code: "invalid_field", message: `Field ${field} does not match the Convex validator` });
        }
        const unresolved = countUnresolvedReferences(document[field], validator);
        unresolvedReferenceCount += unresolved;
        tableUnresolvedReferences += unresolved;
      }
      entries.push({ document, line });
    }
    tableResults.push({ table, records: tableRecordCount, valid: 0, issues: issues.length - tableIssuesStart, unresolvedReferences: tableUnresolvedReferences });
  }

  // Validate scalar table references only after all IDs have been collected, so file order is irrelevant.
  for (const table of tableNames) {
    const fields = definitions[table].validator.fields;
    for (const { document, line } of documentsByTable.get(table) || []) {
      for (const [field, validator] of Object.entries(fields)) {
        const target = scalarIdTarget(validator);
        const id = document[field];
        if (!target || target === "_storage" || id === undefined || id === null) continue;
        if (typeof id === "string" && idsByTable.get(target) && !idsByTable.get(target)!.has(id)) {
          issues.push({ table, line, code: "dangling_reference", message: `${field} references an absent ${target} _id` });
        }
      }
    }
  }

  const issueCountsByTable = new Map<string, number>();
  for (const issue of issues) issueCountsByTable.set(issue.table, (issueCountsByTable.get(issue.table) || 0) + 1);
  const invalidRecords = new Set(issues.filter((issue) => issue.line !== undefined).map((issue) => `${issue.table}:${issue.line}`));
  let validRecords = 0;
  for (const result of tableResults) {
    result.issues = issueCountsByTable.get(result.table) || 0;
    result.valid = (documentsByTable.get(result.table)?.length || 0) - Array.from(invalidRecords).filter((key) => key.startsWith(`${result.table}:`)).length;
    validRecords += result.valid;
  }
  return {
    mode: "dry-run",
    sourceTables: tableNames.length,
    tableFiles,
    records,
    validRecords,
    issueCount: issues.length,
    unresolvedReferenceCount,
    tables: tableResults,
    issues,
  };
}

function runCli(args: string[]): void {
  const directoryFlag = args.indexOf("--snapshot-dir");
  if (directoryFlag < 0 || !args[directoryFlag + 1] || args.includes("--apply")) {
    throw new Error("Usage: npx tsx scripts/validate-supabase-snapshot.ts --snapshot-dir <local-export-directory> (dry-run only)");
  }
  const report = validateSnapshotDirectory(args[directoryFlag + 1]);
  // Report aggregate counts and structural errors only; never print record values or IDs.
  console.log(JSON.stringify(report, null, 2));
  if (report.issueCount > 0) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try { runCli(process.argv.slice(2)); }
  catch (error) {
    console.error(error instanceof Error ? error.message : "Snapshot validation failed");
    process.exitCode = 2;
  }
}
