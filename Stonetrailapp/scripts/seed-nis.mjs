// Optional only: values are copied from the original portal, not new tax guidance.
import pg from 'pg';
if (!process.env.DATABASE_URL) throw Error('DATABASE_URL required');
const c = new pg.Client({ connectionString:process.env.DATABASE_URL }); await c.connect();
try {
 await c.query(`INSERT INTO nis_rate(year,employee_rate,employer_rate,effective_note)
 VALUES (2024,0.0550,0.0650,'Imported app default: effective June 1'),
 (2025,0.0600,0.0700,'Imported app default: effective January'),
 (2026,0.0650,0.0750,'Imported app default: effective January')
 ON CONFLICT(year) DO NOTHING`);
} finally { await c.end(); }
