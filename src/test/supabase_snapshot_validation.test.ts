import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import schema from "../../convex/schema";
import { countUnresolvedReferences, validateSnapshotDirectory } from "../../scripts/validate-supabase-snapshot";

const root = mkdtempSync(join(tmpdir(), "lalao-snapshot-validation-"));
const tableNames = Object.keys(schema.tables);
const creativeValidator = (schema.tables as any).adCampaigns.validator.fields.creative;
const memberIdsValidator = (schema.tables as any).groupChats.validator.fields.memberIds;
assert.equal(countUnresolvedReferences({ mediaStorageId: "storage_synthetic" }, creativeValidator), 1, "nested storage IDs remain unresolved");
assert.equal(countUnresolvedReferences(["user_synthetic"], memberIdsValidator), 1, "JSON ID arrays remain unresolved relationships");
function writeTable(table: string, documents: unknown[]): void {
  const directory = join(root, table);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "documents.jsonl"), documents.map((document) => JSON.stringify(document)).join("\n"));
}

try {
  for (const table of tableNames) writeTable(table, []);
  writeTable("users", [{
    _id: "users_synthetic_1", _creationTime: 1, tokenIdentifier: "synthetic", onboardingStep: "complete", createdAt: 1, updatedAt: 1,
  }]);
  writeTable("recentSearches", [{
    _id: "search_synthetic_1", _creationTime: 2, userId: "users_synthetic_1", query: "synthetic", type: "keyword", timestamp: 2,
  }]);
  const valid = validateSnapshotDirectory(root);
  assert.equal(valid.mode, "dry-run");
  assert.equal(valid.sourceTables, 102);
  assert.equal(valid.tableFiles, 102);
  assert.equal(valid.records, 2);
  assert.equal(valid.validRecords, 2);
  assert.equal(valid.issueCount, 0);

  writeTable("recentSearches", [
    { _id: "search_synthetic_1", _creationTime: 2, userId: "users_synthetic_1", query: "synthetic", type: "keyword", timestamp: 2 },
    { _id: "search_synthetic_1", _creationTime: 3, userId: "users_synthetic_1", query: "synthetic", type: "keyword", timestamp: 3 },
  ]);
  const duplicates = validateSnapshotDirectory(root);
  assert.equal(duplicates.issues.filter((issue) => issue.code === "duplicate_id").length, 1);
  assert.equal(duplicates.validRecords, 2);

  writeTable("recentSearches", [{
    _id: "search_synthetic_2", _creationTime: 4, userId: "users_absent", query: "synthetic", type: "keyword", timestamp: 4,
  }]);
  const dangling = validateSnapshotDirectory(root);
  assert.equal(dangling.issues.filter((issue) => issue.code === "dangling_reference").length, 1);
  assert.equal(dangling.validRecords, 1);
  assert.ok(!JSON.stringify(dangling).includes("users_absent"), "report must not include record IDs or values");
  console.log("Supabase snapshot validation tests passed (synthetic schema-complete snapshot, duplicates, dangling FK, redacted report).");
} finally {
  rmSync(root, { recursive: true, force: true });
}
