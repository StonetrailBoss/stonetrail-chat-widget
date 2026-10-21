# Stonetrail portal — PostgreSQL and Render deployment

This guide supersedes the generic exported-template database/deployment instructions.
The website and staff portal remain a React/TypeScript + Express application.
The separate FastAPI guest chat service and widget pipeline are unchanged.

## What was converted

All 16 tables are included in src/server/db/schema.ts and the generated SQL migration:

| Area | Tables |
|---|---|
| Staff access | user, account, session, verification, staff_role |
| Inventory | inventory_item, audit_log |
| Payroll | employee_rate, timeclock_entry, payslip, nis_rate, employee_deduction |
| Payables | accounts_payable, payable_payment |
| Petty cash | petty_cash_account, petty_cash_entry |

nis_rate and employee_deduction previously existed only in startup SQL, not the
Drizzle schema. Both are now part of the authoritative schema.

| MySQL representation | PostgreSQL representation |
|---|---|
| AUTO_INCREMENT integer IDs | serial integer IDs; imported IDs retained |
| UUID-like varchar IDs | same varchar(36); no forced UUID cast |
| DECIMAL(p,s) | NUMERIC(p,s), unchanged precision and scale |
| DATE | DATE, retaining calendar dates |
| TIMESTAMP | TIMESTAMPTZ |
| BOOLEAN fields | BOOLEAN |
| Integer flags (e.g. nis_exempt) | INTEGER, retaining existing 0/1 API behavior |
| JSON permissions | JSONB |
| ON UPDATE CURRENT_TIMESTAMP | database trigger plus Drizzle update callback |
| mysql2 insertId | PostgreSQL RETURNING |
| mysql2 raw placeholders/results | pg $1 parameters / result.rows |

The runtime uses pg + drizzle-orm/node-postgres and BetterAuth's pg adapter.
mysql2 remains installed only for the one-time source-data transfer script.

Unrelated missing Airo build plugins were removed from Vite configuration so the
export builds independently. Render uses the SSR entry at dist/server/entry.js;
static assets resolve from dist/client. Uploads use UPLOAD_ROOT on a persistent disk.
Database credentials now come from DATABASE_URL, not Nomad's config.json.

The exported server had client-side staff guards but no matching API middleware.
Private APIs now require a real BetterAuth session; administrator and finance-tab
checks are enforced server-side. Receipt downloads require payables permission.
An inventory QCID backfill bug affecting all null-QCID rows was also corrected.

## Deploy a new portal on Render

1. Unzip and commit the contents of Stonetrail_Villas as the portal repository root.
   If using a monorepo, add the corresponding rootDir to render.yaml.
2. Create a Render Blueprint from this repository's render.yaml.
3. The Blueprint defines a Node web service, a separate portal PostgreSQL database,
   and a persistent uploads disk. These are paid resources; review the chosen plans.
4. Set BETTER_AUTH_URL and PUBLIC_URL to the exact portal origin, initially your
   Render HTTPS URL or your configured custom domain. Set OPENAI_API_KEY for the
   existing review-response feature. Configure SMTP separately if needed.
5. Render runs:
   - Build: npm ci --include=dev && npm run build
   - Pre-deploy: npm run db:migrate
   - Start: npm start
   - Health: /api/health (verifies access to the migration ledger)
6. For an empty installation only, set ADMIN_EMAIL, ADMIN_NAME and a temporary
   ADMIN_PASSWORD (12+ characters) in a Render shell, then run:
      npm run db:bootstrap-admin
   This refuses to run if users already exist. Remove ADMIN_PASSWORD afterward.
7. Optional: npm run db:seed-nis inserts the original app's rate defaults only
   where the year is absent. It is not automatically run during migration.
   These are retained app values, not a validation of current statutory rules.
8. Verify /staff/login, inventory, payroll, payables, petty cash, receipt uploads,
   password resets, and public website pages before moving production traffic.
9. Add your custom domain in Render and update DNS when ready. Update both URL
   settings and retain the same BETTER_AUTH_SECRET between deployments.

The Blueprint uses the internal PostgreSQL URL and blocks public database access.
For an external migration workstation, temporarily allow only its IP and use the
Render external URL with appropriate TLS. Alternatively run from a private Render
service with network access to both databases. Do not expose database credentials
or authentication secrets through VITE_ variables.

## Transfer existing MySQL data

No production database was contacted or changed while preparing this package.
Only schema/code were supplied; a SQL dump or source database access is still needed
to move your real records. The included utility reads a live MySQL source.

1. Back up MySQL and separately back up all uploaded files. Keep the original app
   available for rollback. Test the procedure on disposable staging databases.
2. Initialize a NEW EMPTY target using npm run db:migrate. Do not seed rates or
   bootstrap an administrator before transferring data.
3. Pause all source writes for final cutover. Source tables must be transactional
   InnoDB tables for the consistent-snapshot guarantee.
4. Export MYSQL_SOURCE_URL, DATABASE_URL and MYSQL_SOURCE_TIMEZONE. Set the timezone
   deliberately after verifying source TIMESTAMP semantics. Use a numeric offset
   such as +00:00; DATE columns are never shifted. Use a read-only source account.
5. First run:
      npm run db:transfer
   This attempts a complete import, validates counts and exact NUMERIC totals, then
   ROLLS BACK target data. It does not change source rows or target sequences.
6. Review the report. Unknown source columns, missing required tables/columns,
   invalid zero dates, uniqueness problems and foreign-key failures stop the transfer.
   Optional older nis_rate and employee_deduction tables can be absent.
7. Run the actual transfer:
      npm run db:transfer -- --commit
   All target row writes occur in one transaction, retaining IDs and password hashes.
   Sequences are advanced to the maximum imported ID only on the commit path.
   PostgreSQL sequence operations themselves are not transactional; on any failed
   commit attempt, recheck sequences before retrying.
8. Session and verification/reset-token rows are deliberately not imported. Staff
   must sign in again. Existing account password hashes are retained unchanged.
   Verify sign-in for representative accounts before cutover.
9. Copy receipts and inventory uploads into UPLOAD_ROOT/receipts and
   UPLOAD_ROOT/inventory. This script transfers database rows, not file bytes.
   Existing /airo-assets/uploads/... URLs must be rewritten after those files are
   copied. Example, in a reviewed maintenance transaction:
      UPDATE accounts_payable SET receipt_url =
        replace(receipt_url, '/airo-assets/uploads/receipts/', '/api/uploads/receipts/');
      UPDATE payable_payment SET receipt_url =
        replace(receipt_url, '/airo-assets/uploads/receipts/', '/api/uploads/receipts/');
      UPDATE inventory_item SET image_url =
        replace(image_url, '/airo-assets/uploads/inventory/', '/api/uploads/inventory/');
10. Compare sample records, payroll totals, finance balances, roles and attachments.
    Record the transfer report. Switch traffic only after validation.

The transfer is empty-target only: no overwrite, merge, ongoing synchronization or
automatic production cutover. Optional-table absence is reported. Legacy deduction
period dates populate missing effective/end dates. PostgreSQL text comparisons are
case-sensitive, unlike many MySQL collations; review case variants during staging.
Other source tables outside these 16 are outside the import and must be inventoried
separately before decommissioning the source.

## Migration management

npm run db:migrate executes checked-in SQL in drizzle/ under an advisory lock,
with a checksum ledger and a transaction per file. An applied SQL file may not
be changed. There are no asynchronous, error-swallowing startup ALTER statements.

npm run db:generate produces future schema SQL; review it, give each migration an
unambiguous ordered filename, and commit it. Use the supplied db:migrate runner,
not drizzle-kit migrate, because this package maintains its own checksum ledger.
Trigger migration 0001_updated_at.sql is handwritten.

## Validation and limits

- PostgreSQL schema and nine route checks pass against PGlite (PostgreSQL in WASM):
  inventory IDs/QCIDs, payroll import, deductions, payslip generation, NIS, payables,
  petty cash, exact decimal handling, timestamps and API authentication.
- Actual BetterAuth PostgreSQL signup, password sign-in, cookie session,
  non-admin denial and admin access pass in that same environment.
- npm run type-check:app passes for application code.
- Client and SSR production builds pass.
- The original broad npm run type-check still finds a pre-existing test import of
  an absent format-overrides-plugin module. Production type checking excludes tests;
  that unrelated test was not removed or reimplemented.
- Transfer scripts pass syntax validation. Live MySQL-to-Render migration,
  native Render PostgreSQL, browser interaction, SMTP and file-copy cutover have
  not been exercised here.
- No guest-chat integration, payroll policy changes or database consolidation with
  the separate FastAPI conversation store is included in this conversion.
- Existing Google-review/other service connectors may require provider-specific
  configuration on Render. PostgreSQL deployment does not supply those accounts.

Commands:
  npm ci --include=dev
  npm run type-check:app
  npm run test:postgres
  npm run build

For local work, load .env.postgres.example values into your shell or use Node's
--env-file support. Scripts do not silently load credentials from arbitrary files.
