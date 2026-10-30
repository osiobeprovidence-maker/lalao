import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSupabaseSchemaSql } from "./generate-supabase-schema";

const { sql, coverage } = buildSupabaseSchemaSql();
const details = coverage.tablesDetail as Array<{ table: string; fields: number; indexes: number; searchIndexes: number }>;

assert.equal(coverage.tables, 102, "all current Convex tables are represented");
assert.equal(coverage.declaredFields, 1095, "all current declared fields are represented");
assert.equal(coverage.regularIndexes, 259, "all regular Convex indexes are represented");
assert.equal(coverage.searchIndexes, 10, "all Convex search indexes are represented");
assert.equal(details.length, 102, "coverage records every table independently");
assert.equal(new Set(details.map((table) => table.table)).size, 102, "table names are unique");
assert.equal((sql.match(/^CREATE TABLE public\./gm) || []).length, 102, "migration creates every source table");
assert.equal((sql.match(/^CREATE INDEX /gm) || []).length, 269, "migration includes regular and search indexes");

assert.match(sql, /CREATE TABLE public\."recentSearches"/);
assert.match(sql, /"type" text NOT NULL CONSTRAINT "ck_recentSearches_type_enum" CHECK \("type" IN \('keyword', 'person', 'page', 'shop', 'content', 'event'\)\)/);
assert.match(sql, /FOREIGN KEY \("userId"\) REFERENCES public\."users" \("_id"\) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID/);
assert.match(sql, /CREATE INDEX "idx_recentSearches_by_user_time" ON public\."recentSearches" \("userId", "timestamp"\)/);
assert.match(sql, /ALTER TABLE public\."recentSearches" ENABLE ROW LEVEL SECURITY/);
assert.match(sql, /REVOKE ALL ON TABLE public\."recentSearches" FROM anon, authenticated/);
assert.doesNotMatch(sql, /CREATE POLICY/i, "no direct client policy is introduced before auth migration");
assert.match(sql, /uq_bachsWebhookEvents_eventId/);
assert.match(sql, /uq_authIdentities_issuer_subject/);
assert.match(sql, /Convex relationship target _storage/);
assert.match(sql, /Polymorphic Convex relationship retained as text without an FK/);

const orderingMigration = readFileSync(resolve("supabase/migrations/20261030000000_recent_search_shadow_ordering.sql"), "utf8");
const orderingContract = readFileSync(resolve("supabase/tests/database/schema_contract.test.sql"), "utf8");
assert.match(orderingMigration, /pg_advisory_xact_lock/, "per-search operations are serialized in PostgreSQL");
assert.match(orderingMigration, /p_revision < current_revision/, "older operations are rejected after newer events");
assert.match(orderingMigration, /p_revision = current_revision/, "retries of an already-applied operation are idempotent");
assert.match(orderingMigration, /deleted boolean NOT NULL/, "delete revisions persist as tombstones");
assert.match(orderingMigration, /owner does not match shadow state/, "owner changes are rejected");
assert.match(orderingContract, /delayed pre-delete sync is rejected by the tombstone revision/);
assert.match(orderingContract, /retrying an already-applied sync is idempotent/);
assert.match(orderingContract, /different owner cannot overwrite the established shadow state/);

console.log(`Supabase schema generator checks passed (${coverage.tables} tables, ${coverage.declaredFields} fields).`);
