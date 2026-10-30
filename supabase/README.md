# Local Supabase foundation

This is an initial, local-only PostgreSQL schema generated from the current `convex/schema.ts`. It contains no user data and is not linked to a hosted Supabase project.

## Rebuild and verify the migration source

```powershell
npm run supabase:schema:test
npm run supabase:schema:generate
```

The generator refuses to overwrite an existing migration unless explicitly given `--force`. Review generated diffs before regenerating. `supabase/schema-coverage.json` records table, field, index, and relationship coverage.

## Start a local database

The environment checked on 2026-10-29 has Node.js 24.13.0, but no Docker CLI/daemon, no Supabase CLI, and no `winget` command. `wsl.exe` exists, but `wsl --status` returned Access denied from this non-administrator sandbox, so WSL readiness could not be verified. The requested npm CLI installation also failed to complete here because the default cache returned `EPERM` and a temporary-cache retry stalled without output; no Supabase dependency was added. The current process is not running as administrator. The local CLI link marker `supabase/.temp/project-ref` is absent and the checked-in config uses `project_id = "lalao-local"`.

Supabase's Windows local stack needs the CLI and a Docker-compatible runtime. Install the project-scoped CLI from the repository root (this intentionally updates `package.json` and the lockfile):

```powershell
npm install --save-dev supabase
npx supabase --version
```

For Docker Desktop, download the Windows installer from [Docker's official installation page](https://docs.docker.com/desktop/setup/install/windows-install/). Docker supports a per-user install that normally does not need administrator access. From the directory containing the downloaded installer, run:

```powershell
Start-Process -FilePath ".\Docker Desktop Installer.exe" -ArgumentList "install", "--user", "--backend=wsl-2", "--no-windows-containers" -Wait
```

If WSL 2 is missing or needs enabling, Windows may require an administrator PowerShell and a restart; Docker Desktop's WSL backend requires WSL 2. Confirm with `wsl --version` and `wsl --status` after setup. Start Docker Desktop from the Start menu and verify the daemon using `docker version`.

Then, from the repository root, start the local stack, apply the local migration to the local database, and run the SQL contract suite:

```powershell
npx supabase start
npx supabase db reset
npx supabase test db
```

`db reset` deletes this project's local database contents. Before running it, confirm whether any local database data must be preserved; do not reset if it does. It applies the checked-in migrations and the configuration disables seed loading. The pgTAP suite uses synthetic users and search rows in a rollback-only transaction. The mocked REST adapter tests also use synthetic request values. Do not run `supabase link`, `supabase db push`, or any command with `--linked` for this project during this phase.

### Repeatable local validation checklist

From the repository root, after Docker Desktop is running:

```powershell
npm run supabase:schema:test
npx supabase start
npx supabase db reset
npx supabase test db
npm test
npm run build
```

`supabase test db` includes deterministic pgTAP cases for initial sync, duplicate/retried sync, delete, a delayed sync arriving after delete, duplicate/retried delete, and owner mismatch. The test inserts only synthetic rows and rolls back its transaction. Then locally enable `SUPABASE_RECENT_SEARCHES_SHADOW=true` only in a local Convex dev deployment, set its URL to the local Supabase API and its local service-role key, and exercise search/update/remove/clear with synthetic accounts. Check the scheduler's retries and confirm Convex's recent-search query remains the only read path. Never copy these values to production.

## Schema and access behavior

- Convex document IDs remain text in `_id`; `_creationTime` and application timestamps retain epoch-millisecond numeric values.
- Current scalar validators, optionality, literal unions, JSON-shaped values, indexes, and scalar `v.id` relationships are represented in SQL. Convex search indexes are represented as PostgreSQL full-text GIN indexes.
- Convex indexes are non-unique by default. Unique indexes are added only for the source-documented identity keys and Bachs webhook event ID.
- Scalar relationships use `ON DELETE NO ACTION`, deferred constraints, and `NOT VALID`; cascade behavior has not been inferred. Seven top-level `_storage` references (`users.avatarStorageId`, `posts.mediaStorageId`, `comments.mediaStorageId`, `messages.mediaStorageId`/`audioStorageId`, `cycleStories.mediaStorageId`, and `sounds.audioStorageId`) and one nested JSONB reference (`adCampaigns.creative.mediaStorageId`) need an object-store mapping. Three user-ID arrays (`groupChats.memberIds`, `groupCycles.memberIds`, `cycleStories.excludedUserIds`) remain JSONB to preserve source semantics pending lifecycle review. `posts.soundId` is polymorphic (`sounds` ID or free-form string) and remains text without an FK.
- Every application table has RLS enabled, no `anon`/`authenticated` grants, and no user policies. `service_role` access is for trusted server code only and bypasses RLS; every server adapter must authenticate the Convex caller and enforce resource ownership itself.
- Existing `walletPin` and `pinResetOtp` fields are retained for schema parity. Do not import values from these plaintext fields; credential hashing and a compatibility plan are still required before any data migration.

## Migration pilot status

No frontend reads are switched to Supabase. Firebase, Google, and Playsole identity remain on Convex. Mutations atomically schedule internal shadow operations only with an explicit opt-in; they use server-generated strictly increasing per-row revisions. A PostgreSQL RPC takes a per-ID advisory transaction lock, compares revisions, and retains delete tombstones, so delayed syncs cannot recreate a deleted row after the migration is applied. REST destinations are HTTP loopback only, the key stays server-side, requests time out after five seconds, and transient failures are rescheduled with four bounded retries. Convex remains the source of truth. Unit/revision tests pass, and pgTAP regression cases are authored, but the migration has not been run against PostgreSQL in this environment. Do not enable the pilot until `supabase test db` and the local end-to-end smoke test pass. Tombstones are retained indefinitely for ordering safety; cleanup policy is a later storage-management decision. Recent search text and labels are personal data, so tests must use synthetic records only.

## Local snapshot validation (read-only)

The snapshot validator reads an already available local Convex export directory in the layout `<table>/documents.jsonl` (as used by the repository's existing restore scripts). It does not invoke the Convex CLI, contact Convex/Supabase, write into a database, or change files in the snapshot. It validates all source tables and their declared fields, checks duplicate document IDs and dangling scalar table IDs, and reports counts plus structural issue messages without printing record contents or IDs. It counts unresolved storage IDs (including nested creative metadata), ID arrays, and polymorphic references; it does not infer their target mapping. It is a preflight checker, not an importer or a substitute for database constraints/reconciliation.

```powershell
npm run supabase:snapshot:validate -- --snapshot-dir "C:\path\to\local\snapshot_extracted"
```

The command is dry-run only and exits nonzero if any source table file is missing or any structural issue is found. Treat local export contents as sensitive; use only an authorized, encrypted local copy. No export was performed for this validation. Existing `scripts/restore_relational_data.cjs` and `scripts/restore_snapshot_data.cjs` are not safe migration tooling: they contain hard-coded remote Convex destinations and may write data. Do not run them; a future importer must be redesigned with explicit local endpoint allowlisting, dry-run/reconciliation, backup and rollback controls.

Synthetic unit coverage is run as part of `npm run supabase:schema:test`. It validates a schema-complete 102-table fixture, a duplicate ID, a dangling scalar reference, and that the report omits IDs/values. PostgreSQL-backed constraints and pgTAP still require Docker plus the Supabase CLI.
