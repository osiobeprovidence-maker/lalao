import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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

type TableDefinition = {
  validator: { fields: Record<string, Validator> };
  indexes: Array<{ indexDescriptor: string; fields: string[] }>;
  searchIndexes: Array<{ indexDescriptor: string; searchField: string; filterFields: string[] }>;
};

const definitions = schema.tables as unknown as Record<string, TableDefinition>;

function quoteIdent(identifier: string): string {
  if (!identifier || identifier.includes("\0")) throw new Error(`Invalid SQL identifier: ${identifier}`);
  return `"${identifier.replaceAll('"', '""')}"`;
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function shortName(...parts: string[]): string {
  const raw = parts.join("_").replace(/[^a-zA-Z0-9_]/g, "_");
  if (raw.length <= 58) return raw;
  let hash = 2166136261;
  for (const char of raw) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `${raw.slice(0, 49)}_${(hash >>> 0).toString(16).slice(0, 8)}`;
}

function describe(validator: Validator): string {
  let result: string;
  switch (validator.kind) {
    case "id": result = `id(${validator.tableName})`; break;
    case "literal": result = `literal(${JSON.stringify(validator.value)})`; break;
    case "array": result = `array(${describe(validator.element!)})`; break;
    case "object": result = `object({${Object.entries(validator.fields || {}).map(([key, value]) => `${key}:${describe(value)}`).join(",")}})`; break;
    case "union": result = `union(${(validator.members || []).map(describe).join(",")})`; break;
    default: result = validator.kind;
  }
  return validator.isOptional === "optional" ? `optional(${result})` : result;
}

function literalType(value: unknown): string {
  if (typeof value === "string") return "text";
  if (typeof value === "number") return "double precision";
  if (typeof value === "boolean") return "boolean";
  return "jsonb";
}

function sqlType(validator: Validator): { type: string; checks: string[]; enumValues?: unknown[]; foreignKeyTarget?: string } {
  switch (validator.kind) {
    case "string": return { type: "text", checks: [] };
    case "float64": return { type: "double precision", checks: [] };
    case "boolean": return { type: "boolean", checks: [] };
    case "id": return { type: "text", checks: [], foreignKeyTarget: validator.tableName };
    case "any": return { type: "jsonb", checks: [] };
    case "object": return { type: "jsonb", checks: ["object"] };
    case "array": return { type: "jsonb", checks: ["array"] };
    case "null": return { type: "jsonb", checks: ["null"] };
    case "literal": return { type: literalType(validator.value), checks: [], enumValues: [validator.value] };
    case "union": {
      const members = validator.members || [];
      const nonNull = members.filter((member) => member.kind !== "null");
      if (nonNull.length === 1) {
        const resolved = sqlType(nonNull[0]);
        return { ...resolved, enumValues: undefined };
      }
      if (nonNull.length > 0 && nonNull.every((member) => member.kind === "literal" && typeof member.value === "string")) {
        return { type: "text", checks: [], enumValues: nonNull.map((member) => member.value) };
      }
      const memberTypes = nonNull.map((member) => sqlType(member).type);
      if (memberTypes.length && memberTypes.every((type) => type === memberTypes[0])) {
        const refs = nonNull.map((member) => sqlType(member).foreignKeyTarget).filter(Boolean);
        return {
          type: memberTypes[0],
          checks: [],
          foreignKeyTarget: refs.length === nonNull.length && new Set(refs).size === 1 ? refs[0] : undefined,
        };
      }
      return { type: "jsonb", checks: [] };
    }
    default: throw new Error(`Unsupported Convex validator kind: ${validator.kind}`);
  }
}

function checkConstraint(table: string, field: string, type: string, checks: string[], enumValues?: unknown[]): string[] {
  const column = quoteIdent(field);
  const constraints: string[] = [];
  if (checks.length) {
    const expressions = checks.map((check) => check === "null"
      ? `${column} = 'null'::jsonb`
      : `jsonb_typeof(${column}) = ${sqlString(check)}`);
    constraints.push(`CONSTRAINT ${quoteIdent(shortName("ck", table, field, "shape"))} CHECK (${column} IS NULL OR (${expressions.join(" AND ")}))`);
  }
  if (enumValues?.length) {
    const values = enumValues.map((value) => typeof value === "string" ? sqlString(value) : String(value));
    constraints.push(`CONSTRAINT ${quoteIdent(shortName("ck", table, field, "enum"))} CHECK (${column} IN (${values.join(", ")}))`);
  }
  return constraints;
}

function foreignKeyTarget(validator: Validator): string | undefined {
  if (validator.kind === "id") return validator.tableName;
  if (validator.kind !== "union") return undefined;
  const references = (validator.members || []).filter((member) => member.kind !== "null");
  if (references.length === 1 && references[0].kind === "id") return references[0].tableName;
  return undefined;
}

export function buildSupabaseSchemaSql(): { sql: string; coverage: Record<string, unknown> } {
  const tableNames = Object.keys(definitions);
  const knownTables = new Set(tableNames);
  const statements = [
    "-- Generated from convex/schema.ts by scripts/generate-supabase-schema.ts.",
    "-- All source tables and fields are included; Convex IDs remain text for identity continuity.",
    "-- This is a local-first parity schema. No live data is included.",
    "BEGIN;",
    "",
  ];
  let declaredFields = 0;
  let normalIndexes = 0;
  let searchIndexes = 0;
  let foreignKeys = 0;
  let unresolvedStorageRefs = 0;
  let embeddedReferenceFields = 0;
  let unresolvedPolymorphicReferences = 0;
  const tableCoverage: Array<Record<string, unknown>> = [];
  const deferredForeignKeys: string[] = [];
  const deferredIndexes: string[] = [];
  const deferredComments: string[] = [];

  for (const table of tableNames) {
    const definition = definitions[table];
    const fields = definition.validator.fields;
    const columns = [
      `${quoteIdent("_id")} text PRIMARY KEY`,
      `${quoteIdent("_creationTime")} double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000)`,
    ];
    const tableForeignKeys: Array<{ field: string; target: string }> = [];
    const optionalFields: string[] = [];
    const validatorKinds: Record<string, number> = {};

    for (const [field, validator] of Object.entries(fields)) {
      declaredFields += 1;
      validatorKinds[validator.kind] = (validatorKinds[validator.kind] || 0) + 1;
      if (validator.isOptional === "optional") optionalFields.push(field);
      const mapped = sqlType(validator);
      const nullable = validator.isOptional === "optional" || (validator.kind === "union" && validator.members?.some((member) => member.kind === "null"));
      const constraints = checkConstraint(table, field, mapped.type, mapped.checks, mapped.enumValues);
      columns.push(`${quoteIdent(field)} ${mapped.type}${nullable ? "" : " NOT NULL"}${constraints.length ? ` ${constraints.join(" ")}` : ""}`);

      const target = foreignKeyTarget(validator);
      if (target === "_storage") {
        unresolvedStorageRefs += 1;
        deferredComments.push(`COMMENT ON COLUMN public.${quoteIdent(table)}.${quoteIdent(field)} IS ${sqlString(`Convex relationship target _storage; external object-storage mapping unresolved. Validator: ${describe(validator)}`)};`);
      } else if (target) {
        if (!knownTables.has(target)) throw new Error(`${table}.${field} references missing Convex table ${target}`);
        tableForeignKeys.push({ field, target });
      } else if (validator.kind === "array" && validator.element?.kind === "id") {
        embeddedReferenceFields += 1;
        deferredComments.push(`COMMENT ON COLUMN public.${quoteIdent(table)}.${quoteIdent(field)} IS ${sqlString(`Contains an array of Convex IDs referencing ${validator.element.tableName}; retained as JSONB; relational join migration unresolved. Validator: ${describe(validator)}`)};`);
      } else if (validator.kind === "union" && validator.members?.some((member) => member.kind === "id")) {
        unresolvedPolymorphicReferences += 1;
        deferredComments.push(`COMMENT ON COLUMN public.${quoteIdent(table)}.${quoteIdent(field)} IS ${sqlString(`Polymorphic Convex relationship retained as text without an FK. Validator: ${describe(validator)}`)};`);
      } else {
        deferredComments.push(`COMMENT ON COLUMN public.${quoteIdent(table)}.${quoteIdent(field)} IS ${sqlString(`Convex validator: ${describe(validator)}`)};`);
      }
    }

    statements.push(`CREATE TABLE public.${quoteIdent(table)} (\n  ${columns.join(",\n  ")}\n);`);
    statements.push(`COMMENT ON TABLE public.${quoteIdent(table)} IS ${sqlString(`Convex source table: ${table}. RLS is enabled and no client policies are granted in this foundation.`)};`);
    statements.push(`ALTER TABLE public.${quoteIdent(table)} ENABLE ROW LEVEL SECURITY;`);
    statements.push(`REVOKE ALL ON TABLE public.${quoteIdent(table)} FROM anon, authenticated;`);
    statements.push(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${quoteIdent(table)} TO service_role;`);

    for (const { field, target } of tableForeignKeys) {
      const name = shortName("fk", table, field, target);
      deferredForeignKeys.push(`ALTER TABLE public.${quoteIdent(table)} ADD CONSTRAINT ${quoteIdent(name)} FOREIGN KEY (${quoteIdent(field)}) REFERENCES public.${quoteIdent(target)} (${quoteIdent("_id")}) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;`);
      foreignKeys += 1;
    }

    for (const index of definition.indexes) {
      for (const field of index.fields) {
        if (!(field in fields) && field !== "_id" && field !== "_creationTime") throw new Error(`Index ${table}.${index.indexDescriptor} references unknown field ${field}`);
      }
      const name = shortName("idx", table, index.indexDescriptor);
      deferredIndexes.push(`CREATE INDEX ${quoteIdent(name)} ON public.${quoteIdent(table)} (${index.fields.map(quoteIdent).join(", ")});`);
      deferredComments.push(`COMMENT ON INDEX public.${quoteIdent(name)} IS ${sqlString(`Convex non-unique index ${index.indexDescriptor} on ${table}(${index.fields.join(",")})`)};`);
      normalIndexes += 1;
    }

    for (const index of definition.searchIndexes) {
      if (!(index.searchField in fields)) throw new Error(`Search index ${table}.${index.indexDescriptor} references unknown field ${index.searchField}`);
      const name = shortName("sidx", table, index.indexDescriptor);
      deferredIndexes.push(`CREATE INDEX ${quoteIdent(name)} ON public.${quoteIdent(table)} USING GIN (to_tsvector('simple', coalesce(${quoteIdent(index.searchField)}::text, '')));`);
      deferredComments.push(`COMMENT ON INDEX public.${quoteIdent(name)} IS ${sqlString(`Convex full-text search index ${index.indexDescriptor}; searchable field ${index.searchField}; filter fields ${index.filterFields.join(",")}`)};`);
      searchIndexes += 1;
    }

    tableCoverage.push({ table, fields: Object.keys(fields).length, optionalFields: optionalFields.length, indexes: definition.indexes.length, searchIndexes: definition.searchIndexes.length, validatorKinds, scalarRelationships: tableForeignKeys.length });
  }

  statements.push("", "-- Scalar v.id relationships are explicit, non-cascading and initially deferred.", ...deferredForeignKeys);
  statements.push("", "-- Convex indexes are non-unique unless guarded by a verified application invariant.", ...deferredIndexes);
  statements.push("", ...deferredComments);
  statements.push(
    "",
    "-- Enforce known atomic uniqueness/idempotency invariants in the new store.",
    `CREATE UNIQUE INDEX ${quoteIdent("uq_authIdentities_issuer_subject")} ON public.${quoteIdent("authIdentities")} (${quoteIdent("issuer")}, ${quoteIdent("subject")});`,
    `CREATE UNIQUE INDEX ${quoteIdent("uq_authIdentities_tokenIdentifier")} ON public.${quoteIdent("authIdentities")} (${quoteIdent("tokenIdentifier")});`,
    `CREATE UNIQUE INDEX ${quoteIdent("uq_bachsWebhookEvents_eventId")} ON public.${quoteIdent("bachsWebhookEvents")} (${quoteIdent("eventId")});`,
    "",
    "COMMIT;",
    "",
  );

  return {
    sql: statements.join("\n"),
    coverage: {
      source: "convex/schema.ts",
      tables: tableNames.length,
      declaredFields,
      systemColumns: tableNames.length * 2,
      regularIndexes: normalIndexes,
      searchIndexes,
      scalarForeignKeys: foreignKeys,
      unresolvedStorageReferences: unresolvedStorageRefs,
      embeddedReferenceFields,
      unresolvedPolymorphicReferences,
      uniquenessConstraints: ["authIdentities(issuer,subject)", "authIdentities(tokenIdentifier)", "bachsWebhookEvents(eventId)"],
      rls: { enabledTables: tableNames.length, directClientPolicies: 0, roleAccess: "service_role only; server-side authorization still required" },
      tablesDetail: tableCoverage,
    },
  };
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("generate-supabase-schema.ts")) {
  const { sql, coverage } = buildSupabaseSchemaSql();
  const migrationPath = resolve("supabase/migrations/20261029000000_initial_convex_schema.sql");
  const coveragePath = resolve("supabase/schema-coverage.json");
  mkdirSync(dirname(migrationPath), { recursive: true });
  if (existsSync(migrationPath) && !process.argv.includes("--force")) {
    throw new Error(`${migrationPath} already exists; refusing to overwrite it. Review it and use --force only when you intend regeneration.`);
  }
  writeFileSync(migrationPath, sql, "utf8");
  writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`, "utf8");
  console.log(`Generated ${migrationPath}`);
  console.log(JSON.stringify({ tables: coverage.tables, fields: coverage.declaredFields, regularIndexes: coverage.regularIndexes, searchIndexes: coverage.searchIndexes, scalarForeignKeys: coverage.scalarForeignKeys, unresolvedStorageReferences: coverage.unresolvedStorageReferences, embeddedReferenceFields: coverage.embeddedReferenceFields, unresolvedPolymorphicReferences: coverage.unresolvedPolymorphicReferences }, null, 2));
}
