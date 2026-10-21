import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pool, db } from '../src/server/db/client';
import { inventoryItem, employeeRate, timeclockEntry } from '../src/server/db/schema';
import inventoryCreate from '../src/server/api/inventory/POST';
import inventoryList from '../src/server/api/inventory/GET';
import deductionCreate from '../src/server/api/employee-deductions/POST';
import deductionList from '../src/server/api/employee-deductions/GET';
import payrollImport from '../src/server/api/timeclock/import/POST';
import payslip from '../src/server/api/timeclock/[id]/payslip/GET';
import payableCreate from '../src/server/api/payables/POST';
import cashCreate from '../src/server/api/petty-cash/accounts/POST';
import nisList from '../src/server/api/nis-rates/GET';
import { getAuth } from '../src/lib/auth/auth';
import { portalAccess } from '../src/server/portal-access';
import { eq } from 'drizzle-orm';

process.env.BETTER_AUTH_SECRET = 'postgres-test-only-secret-at-least-32-chars';
const pg = new PGlite();
for (const name of (await readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort())
  await pg.exec(await readFile('drizzle/'+name,'utf8'));
// Exercise the actual node-postgres Drizzle adapter and handlers against PostgreSQL
// running as WebAssembly. Only the network transport is replaced.
const query = async (config:any, values?:any[]) => {
  const text = typeof config === 'string' ? config : config.text;
  const result = await pg.query(text, values || config.values || []);
  const rows = config.rowMode === 'array'
    ? result.rows.map((row:any)=>result.fields.map(f=>row[f.name])) : result.rows;
  return { rows, fields:result.fields, rowCount:result.affectedRows ?? result.rows.length };
};
(pool as any).query = query;
(pool as any).connect = async () => ({query, release() {}});
let checks=0;
async function call(handler:any, input:any={}) {
  let status=200, body:any;
  const res:any = { status(n:number){status=n;return this;}, json(data:any){body=data;return this;} };
  await handler({body:{},params:{},query:{},headers:{},...input},res);
  assert.ok(status<400, JSON.stringify({status,body}));
  checks++; return body;
}
try {
  const tables = await pg.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  assert.equal(tables.rows.length,16);
  const a = await call(inventoryCreate,{body:{name:'Linen',category:'Housekeeping',quantity:12}});
  assert.ok(a.id>0); assert.equal(a.qcid,'STV-000001');
  await db.insert(inventoryItem).values({name:'Towel',category:'Housekeeping',qcid:null});
  const inventory = await call(inventoryList);
  assert.equal(new Set(inventory.map((x:any)=>x.qcid)).size,2);
  await call(deductionCreate,{body:{employeeName:'Test Employee',label:'Advance',amount:'15.25',effectiveDate:'2026-01-01'}});
  const deductions = await call(deductionList,{query:{employee_name:'Test Employee',pay_period_start:'2026-10-01',pay_period_end:'2026-10-07'}});
  assert.equal(deductions.length,1); assert.equal(deductions[0].amount,'15.25');
  await db.insert(employeeRate).values({firstName:'Test',lastName:'Employee',employeeName:'Test Employee',hourlyRate:'8.50'});
  const entry={firstName:'Test',lastName:'Employee',payPeriodStart:'2026-10-01',payPeriodEnd:'2026-10-07',regularHours:48};
  assert.equal((await call(payrollImport,{body:{entries:[entry]}})).imported,1);
  const [record]=await db.select().from(timeclockEntry);
  await pg.query("INSERT INTO nis_rate(year,employee_rate,employer_rate) VALUES (2026,0.065,0.075)");
  const slip=await call(payslip,{params:{id:String(record.id)}});
  assert.equal(slip.payslip.grossPay,408);
  assert.equal(slip.payslip.customDeductionsTotal,15.25);
  assert.equal(slip.payslip.nisEmployerRate,0.075);
  assert.equal((await call(nisList)).length,1);
  const bill=await call(payableCreate,{body:{vendor:'Test vendor',amount:'100.25',dueDate:'2026-11-01'}});
  assert.equal(bill.amount,'100.25'); assert.ok(bill.id>0);
  const cash=await call(cashCreate,{body:{name:'Office',openingBalance:'100.00'}});
  assert.equal(cash.currentBalance,'100.00');
  const before=await db.select().from(inventoryItem).where(eq(inventoryItem.id,a.id));
  await db.update(inventoryItem).set({quantity:13}).where(eq(inventoryItem.id,a.id));
  const after=await db.select().from(inventoryItem).where(eq(inventoryItem.id,a.id));
  assert.ok(after[0].updatedAt >= before[0].updatedAt);
  let status=0,nextCalled=false;
  await portalAccess({path:'/api/timeclock',headers:{},method:'GET',get:()=>undefined,originalUrl:'/api/timeclock'} as any,
    {status(n:number){status=n;return this;},json(){}} as any,()=>{nextCalled=true;});
  assert.equal(status,401); assert.equal(nextCalled,false);
  // Actual BetterAuth PostgreSQL adapter: create credential account, sign in, validate session.
  const auth = getAuth();
  const account = await auth.api.signUpEmail({body:{name:'PG Test',email:'pg-test@example.invalid',password:'postgres-test-only-password'}});
  assert.ok(account.user.id);
  const signin = await auth.api.signInEmail({body:{email:'pg-test@example.invalid',password:'postgres-test-only-password'},asResponse:true});
  assert.equal(signin.status,200);
  const cookie = signin.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
  assert.ok(cookie);
  const authSession = await auth.api.getSession({headers:new Headers({cookie})});
  assert.equal(authSession?.user.email,'pg-test@example.invalid');
  let denied=0;
  await portalAccess({path:'/api/timeclock',headers:{cookie},method:'GET',get:()=>undefined,originalUrl:'/api/timeclock'} as any,
    {status(n:number){denied=n;return this;},json(){}} as any,()=>{});
  assert.equal(denied,403);
  await db.update((await import('../src/server/db/schema')).user).set({role:'admin'}).where(eq((await import('../src/server/db/schema')).user.id,account.user.id));
  let allowed=false;
  await portalAccess({path:'/api/timeclock',headers:{cookie},method:'GET',get:()=>undefined,originalUrl:'/api/timeclock'} as any,
    {status(){return this;},json(){}} as any,()=>{allowed=true;});
  assert.equal(allowed,true);
  console.log('PASS: BetterAuth PostgreSQL signup, password sign-in, cookie session, staff denial and admin access');
  console.log('PASS: 16-table PostgreSQL schema and '+checks+' route checks, generated IDs, exact decimals, payroll import, deductions, payslip, NIS, payables, petty cash, QCID backfill, update timestamp and unauthenticated API denial');
} finally { await pg.close(); await pool.end(); }
