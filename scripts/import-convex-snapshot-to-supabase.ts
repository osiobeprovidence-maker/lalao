import pg from "pg";
import {
  existsSync,
  readFileSync,
  readdirSync
} from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const snapshotArg = args.find((arg) => arg.startsWith("--snapshot-dir="));
const targetHostArg = args.find((arg) => arg.startsWith("--target-host="));
const targetDatabaseArg = args.find((arg) => arg.startsWith("--target-database="));
const confirmationArg = args.find((arg) => arg.startsWith("--confirm-target="));
const snapshotDir = resolve(
  snapshotArg ? snapshotArg.slice("--snapshot-dir=".length) : "./lalao-convex-snapshot"
);
const targetHost = targetHostArg?.slice("--target-host=".length).trim();
const targetDatabase = targetDatabaseArg?.slice("--target-database=".length).trim();
const confirmedTarget = confirmationArg?.slice("--confirm-target=".length).trim();
const databaseUrl = process.env.LALAO_IMPORT_DATABASE_URL;

if (!targetHost || !targetDatabase || !databaseUrl) {
  console.error(
    "Import requires --target-host, --target-database, and LALAO_IMPORT_DATABASE_URL."
  );
  process.exit(2);
}

let parsedDatabaseUrl: URL;
try {
  parsedDatabaseUrl = new URL(databaseUrl);
} catch {
  console.error("LALAO_IMPORT_DATABASE_URL must be a valid PostgreSQL connection URL.");
  process.exit(2);
}

if (parsedDatabaseUrl.protocol !== "postgres:" && parsedDatabaseUrl.protocol !== "postgresql:") {
  console.error("LALAO_IMPORT_DATABASE_URL must use PostgreSQL.");
  process.exit(2);
}

const urlDatabase = decodeURIComponent(parsedDatabaseUrl.pathname.replace(/^\/+/, ""));
if (
  parsedDatabaseUrl.hostname.toLowerCase() !== targetHost.toLowerCase() ||
  urlDatabase !== targetDatabase
) {
  console.error("The connection URL does not match the explicitly selected host and database.");
  process.exit(2);
}

const targetLabel = `${targetHost}/${targetDatabase}`;
if (apply && confirmedTarget !== targetLabel) {
  console.error(
    `Write mode requires --confirm-target=${targetLabel}. No database connection was opened.`
  );
  process.exit(2);
}

const EXPECTED_TABLES = 102;

const sensitiveFields = [
  "walletPin",
  "pinResetOtp",
  "walletPinHash",
  "pinSalt",
  "pinResetOtpHash",
  "pinResetOtpSalt",
  "pinResetExpiresAt",
  "pinResetOtpExpiresAt",
  "pinResetOtpUsedAt",
  "pinResetOtpLastRequestedAt",
  "pinResetOtpRequestWindowStartedAt",
  "pinLockedUntil"
];

const resetFields = {
  pinFailCount: 0,
  pinResetOtpFailCount: 0,
  pinResetOtpRequestCount: 0,
  pinRequiresSetup: true
};

const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;

if (!existsSync(snapshotDir)) {
  throw new Error(`Snapshot directory not found: ${snapshotDir}`);
}

const tables = readdirSync(snapshotDir, { withFileTypes: true })
  .filter((entry) =>
    entry.isDirectory() &&
    !entry.name.startsWith("_") &&
    existsSync(resolve(snapshotDir, entry.name, "documents.jsonl"))
  )
  .map((entry) => ({
    name: entry.name,
    file: resolve(snapshotDir, entry.name, "documents.jsonl")
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

if (tables.length !== EXPECTED_TABLES) {
  throw new Error(
    `Expected ${EXPECTED_TABLES} snapshot tables; found ${tables.length}. Import stopped.`
  );
}

const client = new pg.Client({ connectionString: databaseUrl });

let currentTable = "";
let currentLine = 0;
let transactionOpen = false;
let totalRows = 0;
let strippedCredentials = 0;

try {
  await client.connect();

  const connectedDatabase = await client.query("SELECT current_database() AS name");
  if (connectedDatabase.rows[0]?.name !== targetDatabase) {
    throw new Error("Connected database does not match the explicitly selected database.");
  }
  console.log(`Target verified: ${targetLabel}`);

  const catalog = await client.query(`
    SELECT
      table_name,
      column_name,
      data_type,
      udt_name,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);

  const columnsByTable = new Map<string, Map<string, any>>();

  for (const column of catalog.rows) {
    if (!columnsByTable.has(column.table_name)) {
      columnsByTable.set(column.table_name, new Map());
    }
    columnsByTable.get(column.table_name)!.set(column.column_name, column);
  }

  for (const table of tables) {
    if (!columnsByTable.has(table.name)) {
      throw new Error(`Snapshot table has no matching public database table: ${table.name}`);
    }
  }

  console.log("Checking exact destination table emptiness...");

  const occupied: string[] = [];

  for (const table of tables) {
    const result = await client.query(
      `SELECT EXISTS (SELECT 1 FROM public.${quote(table.name)} LIMIT 1) AS occupied`
    );
    if (result.rows[0].occupied) occupied.push(table.name);
  }

  if (occupied.length) {
    throw new Error(
      `Import stopped: destination tables already contain records: ${occupied.join(", ")}`
    );
  }

  console.log(`Confirmed: all ${tables.length} destination tables are empty.`);
  console.log(apply ? "Mode: APPLY" : "Mode: DRY RUN (will roll back)");

  await client.query("BEGIN");
  transactionOpen = true;
  await client.query("SET CONSTRAINTS ALL DEFERRED");

  for (const table of tables) {
    currentTable = table.name;
    currentLine = 0;

    const tableColumns = columnsByTable.get(table.name)!;
    const content = readFileSync(table.file, "utf8");
    const lines = content.split(/\r?\n/);
    const skippedIdentityLines = new Set<number>();

    if (table.name === "authIdentities") {
      const parsed = lines
        .map((line, index) => ({
          lineNumber: index + 1,
          record: line.trim() ? JSON.parse(line) : null
        }))
        .filter((entry): entry is { lineNumber: number; record: Record<string, any> } =>
          entry.record !== null
        );

      const identityKey = (r: Record<string, any>) =>
        JSON.stringify([r.issuer, r.subject]);

      const tokenGroups = new Map<string, typeof parsed>();
      const identityGroups = new Map<string, typeof parsed>();

      for (const entry of parsed) {
        const r = entry.record;

        if (
          typeof r.issuer !== "string" ||
          typeof r.subject !== "string" ||
          typeof r.tokenIdentifier !== "string"
        ) {
          throw new Error("Invalid auth identity key fields; refusing automatic deduplication.");
        }

        const key = identityKey(r);
        if (!identityGroups.has(key)) identityGroups.set(key, []);
        identityGroups.get(key)!.push(entry);

        if (!tokenGroups.has(r.tokenIdentifier)) {
          tokenGroups.set(r.tokenIdentifier, []);
        }
        tokenGroups.get(r.tokenIdentifier)!.push(entry);
      }

      for (const group of tokenGroups.values()) {
        if (group.length > 1) {
          const keys = new Set(group.map(entry => identityKey(entry.record)));
          if (keys.size !== 1) {
            throw new Error("A tokenIdentifier is shared by different identities; refusing import.");
          }
        }
      }

      for (const group of identityGroups.values()) {
        if (group.length < 2) continue;

        const comparable = (r: Record<string, any>) =>
          JSON.stringify(
            Object.fromEntries(
              Object.keys(r)
                .filter(field => !["_id", "_creationTime", "linkedAt"].includes(field))
                .sort()
                .map(field => [field, r[field]])
            )
          );

        if (new Set(group.map(entry => comparable(entry.record))).size !== 1) {
          throw new Error("Duplicate auth identities contain conflicting fields; refusing import.");
        }

        if (new Set(group.map(entry => entry.record.tokenIdentifier)).size !== 1) {
          throw new Error("Duplicate auth identities have different token identifiers; refusing import.");
        }

        for (const entry of group) {
          if (typeof entry.record.linkedAt !== "number" ||
              !Number.isFinite(entry.record.linkedAt)) {
            throw new Error("Duplicate auth identity has an invalid linkedAt timestamp; refusing import.");
          }
        }

        const ordered = [...group].sort((a, b) =>
          a.record.linkedAt - b.record.linkedAt ||
          a.record._creationTime - b.record._creationTime
        );

        for (const duplicate of ordered.slice(1)) {
          skippedIdentityLines.add(duplicate.lineNumber);
        }
      }

      console.log(
        `authIdentities: safely skipped ${skippedIdentityLines.size} duplicate rows; retained earliest linkedAt records.`
      );
    }

    for (const line of lines) {
      currentLine++;
      if (!line.trim() || skippedIdentityLines.has(currentLine)) continue;

      let record: Record<string, any>;

      try {
        record = JSON.parse(line);
      } catch {
        throw new Error(`Invalid JSON in ${currentTable}, line ${currentLine}`);
      }

      if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new Error(`Invalid document in ${currentTable}, line ${currentLine}`);
      }

      if (
        typeof record._id !== "string" ||
        typeof record._creationTime !== "number" ||
        !Number.isFinite(record._creationTime)
      ) {
        throw new Error(`Invalid document identity in ${currentTable}, line ${currentLine}`);
      }

      const unknownFields = Object.keys(record).filter(
        (field) => !tableColumns.has(field)
      );

      if (unknownFields.length) {
        throw new Error(
          `Unknown source columns in ${currentTable}, line ${currentLine}: ${unknownFields.join(", ")}`
        );
      }

      const cleanRecord = { ...record };

      for (const field of sensitiveFields) {
        if (Object.hasOwn(cleanRecord, field)) {
          delete cleanRecord[field];
          strippedCredentials++;
        }
      }

      if (table.name === "userWallets") {
        for (const [field, value] of Object.entries(resetFields)) {
          if (tableColumns.has(field)) cleanRecord[field] = value;
        }
      }

      const fields = Object.keys(cleanRecord);

      if (!fields.length) {
        throw new Error(`Empty document in ${currentTable}, line ${currentLine}`);
      }

      const values = fields.map((field) => {
        const column = tableColumns.get(field)!;
        const value = cleanRecord[field];

        if (value === null || value === undefined) return null;

        return column.udt_name === "jsonb"
          ? JSON.stringify(value)
          : value;
      });

      const placeholders = fields.map((_, index) => `$${index + 1}`);

      const sql = `
        INSERT INTO public.${quote(table.name)}
        (${fields.map(quote).join(", ")})
        VALUES (${placeholders.join(", ")})
      `;

      await client.query(sql, values);
      totalRows++;
    }

    console.log(`Checked ${table.name}`);
  }

  currentTable = "constraint validation";
  currentLine = 0;

  await client.query("SET CONSTRAINTS ALL IMMEDIATE");

  if (apply) {
    await client.query("COMMIT");
    transactionOpen = false;
    console.log("Import committed successfully.");
  } else {
    await client.query("ROLLBACK");
    transactionOpen = false;
    console.log("Dry run passed. All inserted test records were rolled back.");
  }

  console.log(`Snapshot tables: ${tables.length}`);
  console.log(`Documents processed: ${totalRows}`);
  console.log(`Sensitive credential fields excluded: ${strippedCredentials}`);
  console.log(`Mode: ${apply ? "APPLIED" : "DRY RUN ONLY"}`);

} catch (error: any) {
  if (transactionOpen) {
    try {
      await client.query("ROLLBACK");
    } catch {}
  }

  console.error("Import stopped safely.");
  console.error(`Table: ${currentTable || "pre-import checks"}`);
  if (currentLine) console.error(`JSONL line: ${currentLine}`);
  if (error?.code) console.error(`Database error code: ${error.code}`);
  if (error?.constraint) console.error(`Constraint: ${error.constraint}`);
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;

} finally {
  await client.end().catch(() => {});
}
