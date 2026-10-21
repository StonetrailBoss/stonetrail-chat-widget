// Reads MySQL only. Import into an initialized, EMPTY PostgreSQL portal database.
// All target data writes are one transaction. Source remains unchanged.
import mysql from 'mysql2/promise';
import pg from 'pg';
const commit = process.argv.includes('--commit');
if (!process.env.MYSQL_SOURCE_URL || !process.env.DATABASE_URL) {
  throw Error('Set MYSQL_SOURCE_URL and DATABASE_URL. Default mode is validation with rollback.');
}
if (!process.env.MYSQL_SOURCE_TIMEZONE) throw Error('Set MYSQL_SOURCE_TIMEZONE explicitly, e.g. +00:00 after verifying source timestamp semantics');
const tables = ['staff_role','user','account','session','verification','inventory_item','audit_log',
                'timeclock_entry','employee_rate','nis_rate','employee_deduction','accounts_payable',
                'payable_payment','petty_cash_account','petty_cash_entry','payslip'];
const skipped = new Set(['session','verification']); // reauthenticate and invalidate reset tokens
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const source = await mysql.createConnection({
  uri: process.env.MYSQL_SOURCE_URL, dateStrings: true, supportBigNumbers: true, bigNumberStrings: true,
});
const target = new pg.Client({ connectionString: process.env.DATABASE_URL });
await target.connect();
let sourceOpen = false, targetOpen = false;
try {
  await source.query('SET time_zone = ?', [process.env.MYSQL_SOURCE_TIMEZONE]);
  await source.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await source.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY'); sourceOpen = true;
  await target.query('BEGIN'); targetOpen = true;
  await target.query("SET LOCAL timezone TO 'UTC'");
  // Locks prevent concurrent portal writes during validation/import.
  await target.query('LOCK TABLE ' + tables.map(quote).join(',') + ' IN ACCESS EXCLUSIVE MODE');
  for (const table of tables) {
    const { rows: [{ count }] } = await target.query('SELECT count(*) FROM ' + quote(table));
    if (count !== '0') throw Error('Target must be empty: ' + table);
  }
  const report = [];
  for (const table of tables) {
    if (skipped.has(table)) { report.push({table, skipped: 'Reauthentication required'}); continue; }
    const [sourceColumns] = await source.query('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY ORDINAL_POSITION',[table]);
    if (!sourceColumns.length) {
      // Two tables were optional in older deployments.
      if (['nis_rate','employee_deduction'].includes(table)) { report.push({table, rows:0, missing:true}); continue; }
      throw Error('Source table missing: ' + table);
    }
    const { rows: columns } = await target.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",[table]);
    const names = new Set(columns.map(c => c.column_name));
    const sourceNames = new Set(sourceColumns.map(c => c.COLUMN_NAME));
    const unknown = [...sourceNames].filter(n => !names.has(n));
    if (unknown.length) throw Error('Unmapped source columns in ' + table + ': ' + unknown.join(', '));
    for (const col of columns) {
      if (!sourceNames.has(col.column_name) && col.is_nullable === 'NO' && col.column_default === null)
        throw Error('Required target column absent in source: ' + table + '.' + col.column_name);
    }
    const selected = columns.filter(c => sourceNames.has(c.column_name));
    // Keyset pagination bounds memory. Every portal table has a primary key id.
    let last = null, copied = 0;
    for (;;) {
      const [rows] = await source.query(
        'SELECT * FROM `' + table + '`' + (last === null ? '' : ' WHERE id > ?') + ' ORDER BY id LIMIT 500',
        last === null ? [] : [last]);
      if (!rows.length) break;
      for (const row of rows) {
        const values = selected.map(col => {
          let value = row[col.column_name];
          if (table === 'employee_deduction' && col.column_name === 'effective_date')
            value ??= row.pay_period_start;
          if (table === 'employee_deduction' && col.column_name === 'end_date')
            value ??= row.pay_period_end;
          if (value === null) return null;
          if (col.data_type === 'boolean') return Boolean(Number(value));
          if (col.data_type === 'jsonb') return typeof value === 'string' ? value : JSON.stringify(value);
          if (col.data_type === 'timestamp with time zone') {
            if (String(value).startsWith('0000-')) throw Error('Invalid zero timestamp in ' + table);
            // MySQL TIMESTAMP values are read in explicitly selected source timezone.
            const offset = process.env.MYSQL_SOURCE_TIMEZONE;
            if (!/^[+-]\d{2}:\d{2}$/.test(offset)) throw Error('Use a numeric MYSQL_SOURCE_TIMEZONE offset');
            return String(value).replace(' ', 'T') + offset;
          }
          if (col.data_type === 'date' && String(value).startsWith('0000-'))
            throw Error('Invalid zero date in ' + table);
          return value; // Keep exact decimal strings and original IDs.
        });
        await target.query('INSERT INTO ' + quote(table) + ' (' + selected.map(c=>quote(c.column_name)).join(',') + ') VALUES (' + values.map((_,i)=>'$'+(i+1)).join(',') + ')', values);
      }
      copied += rows.length; last = rows.at(-1).id;
    }
    const [[{ count: sourceCount }]] = await source.query('SELECT count(*) AS count FROM `'+table+'`');
    const { rows: [{ count: targetCount }] } = await target.query('SELECT count(*) FROM '+quote(table));
    if (BigInt(sourceCount) !== BigInt(targetCount) || BigInt(copied) !== BigInt(sourceCount)) throw Error('Count mismatch: '+table);
    // Validate exact numeric totals, not JS floating point, for every monetary/hour field.
    for (const col of selected.filter(c => c.data_type === 'numeric')) {
      const [[{ total: from }]] = await source.query('SELECT COALESCE(SUM(`'+col.column_name+'`),0) AS total FROM `'+table+'`');
      const { rows: [{ matches }] } = await target.query('SELECT COALESCE(SUM('+quote(col.column_name)+'),0) = $1::numeric AS matches FROM '+quote(table),[String(from)]);
      if (!matches) throw Error('Numeric total mismatch: '+table+'.'+col.column_name);
    }
    report.push({table, rows:copied});
  }
  // Preserve next-ID behavior without touching sequences in rollback-only validation.
  // setval is not transactional in PostgreSQL; only perform on the committed path.
  if (commit) for (const table of tables) {
    const {rows:[{seq}]} = await target.query("SELECT pg_get_serial_sequence($1,'id') AS seq",[quote(table)]);
    if (seq) {
      const {rows:[{maximum}]} = await target.query('SELECT MAX(id) AS maximum FROM '+quote(table));
      await target.query('SELECT setval($1::regclass,$2,$3)',[seq,maximum ?? 1,maximum !== null]);
    }
  }
  await target.query(commit ? 'COMMIT' : 'ROLLBACK'); targetOpen = false;
  await source.query('ROLLBACK'); sourceOpen = false;
  console.log(JSON.stringify({mode:commit?'committed':'validated-and-rolled-back', tables:report},null,2));
} finally {
  if (targetOpen) await target.query('ROLLBACK').catch(()=>{});
  if (sourceOpen) await source.query('ROLLBACK').catch(()=>{});
  await target.end(); await source.end();
}
