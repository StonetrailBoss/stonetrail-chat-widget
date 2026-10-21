/**
 * Drizzle ORM schema entrypoint.
 */
import { pgTable, varchar, text, boolean, timestamp, integer, serial, decimal, date, jsonb } from 'drizzle-orm/pg-core';
import { randomUUID } from 'crypto';

// ─── Finance tab keys ─────────────────────────────────────────────────────────
export const FINANCE_TABS = ['records', 'rates', 'reports', 'staff', 'payables', 'petty-cash'] as const;
export type FinanceTab = typeof FINANCE_TABS[number];

// ─── Custom roles ─────────────────────────────────────────────────────────────
export const staffRole = pgTable('staff_role', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  // JSON array of FinanceTab values this role can access
  tabPermissions: jsonb('tab_permissions').notNull().$type<FinanceTab[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const user = pgTable('user', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  role: varchar('role', { length: 50 }).default('staff'),
  // FK to staff_role — null means no custom role (admin sees all, staff sees none by default)
  staffRoleId: varchar('staff_role_id', { length: 36 }),
});

export const session = pgTable('session', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const verification = pgTable('verification', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
});

// ── Inventory tables ──────────────────────────────────────────────────────────

export const inventoryItem = pgTable('inventory_item', {
  id: serial('id').primaryKey(),
  qcid: varchar('qcid', { length: 20 }),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  quantity: integer('quantity').notNull().default(0),
  unit: varchar('unit', { length: 50 }).notNull().default('units'),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  description: text('description'),
  notes: text('notes'),
  imageUrl: varchar('image_url', { length: 1000 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  itemId: integer('item_id'),
  details: text('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Timeclock & Payslip tables ────────────────────────────────────────────────

export const timeclockEntry = pgTable('timeclock_entry', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull().default(''),
  lastName: varchar('last_name', { length: 100 }).notNull().default(''),
  employeeName: varchar('employee_name', { length: 255 }).notNull(),
  department: varchar('department', { length: 100 }).notNull().default('General'),
  position: varchar('position', { length: 100 }).notNull().default('Staff'),
  payPeriodStart: date('pay_period_start', { mode: 'date' }).notNull(),
  payPeriodEnd: date('pay_period_end', { mode: 'date' }).notNull(),
  regularHours: decimal('regular_hours', { precision: 8, scale: 2 }).notNull().default('0'),
  overtimeHours: decimal('overtime_hours', { precision: 8, scale: 2 }).notNull().default('0'),
  holidayHours: decimal('holiday_hours', { precision: 8, scale: 2 }).notNull().default('0'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }).notNull(),
  allowances: decimal('allowances', { precision: 10, scale: 2 }).notNull().default('0'),
  notes: text('notes'),
  bankName: varchar('bank_name', { length: 255 }),
  bankAccount: varchar('bank_account', { length: 100 }),
  bankRouting: varchar('bank_routing', { length: 50 }),
  payDate: date('pay_date', { mode: 'date' }),
  nisExempt: integer('nis_exempt').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
// One row per employee — stores standing pay info so it never needs re-entering.
// CSV import looks up by (firstName + lastName) and auto-fills hourlyRate, bank, etc.
export const employeeRate = pgTable('employee_rate', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  employeeName: varchar('employee_name', { length: 255 }).notNull().unique(),
  department: varchar('department', { length: 100 }).notNull().default('General'),
  position: varchar('position', { length: 100 }).notNull().default('Staff'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }).notNull(),
  allowances: decimal('allowances', { precision: 10, scale: 2 }).notNull().default('0'),
  bankName: varchar('bank_name', { length: 255 }),
  bankAccount: varchar('bank_account', { length: 100 }),
  bankRouting: varchar('bank_routing', { length: 50 }),
  nisExempt: integer('nis_exempt').notNull().default(0),
  // Archive fields — set when an employee leaves; records are retained for compliance
  isArchived: integer('is_archived').notNull().default(0),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ── Accounts Payable ─────────────────────────────────────────────────────────

export const accountsPayable = pgTable('accounts_payable', {
  id: serial('id').primaryKey(),
  vendor: varchar('vendor', { length: 255 }).notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  billDate: date('bill_date', { mode: 'date' }),
  dueDate: date('due_date', { mode: 'date' }).notNull(),
  datePaid: date('date_paid', { mode: 'date' }),
  category: varchar('category', { length: 100 }).notNull().default('General'),
  status: varchar('status', { length: 50 }).notNull().default('unpaid'), // unpaid | paid | overdue | void
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }).notNull().default('0'),
  reconciled: integer('reconciled').notNull().default(0),
  bankTransactionId: varchar('bank_transaction_id', { length: 255 }),
  bankTransactionDate: date('bank_transaction_date', { mode: 'date' }),
  bankTransactionNote: text('bank_transaction_note'),
  receiptFilename: varchar('receipt_filename', { length: 500 }),
  receiptUrl: varchar('receipt_url', { length: 1000 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const payablePayment = pgTable('payable_payment', {
  id: serial('id').primaryKey(),
  payableId: integer('payable_id').notNull().references(() => accountsPayable.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  datePaid: date('date_paid', { mode: 'date' }).notNull(),
  method: varchar('method', { length: 100 }),
  reference: varchar('reference', { length: 255 }),
  notes: text('notes'),
  receiptFilename: varchar('receipt_filename', { length: 500 }),
  receiptUrl: varchar('receipt_url', { length: 1000 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Petty Cash ────────────────────────────────────────────────────────────────

/**
 * petty_cash_account — one row per fund (e.g. "Main Office Fund").
 * Tracks the current float balance.
 */
export const pettyCashAccount = pgTable('petty_cash_account', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  openingBalance: decimal('opening_balance', { precision: 12, scale: 2 }).notNull().default('0'),
  currentBalance: decimal('current_balance', { precision: 12, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 10 }).notNull().default('EC$'),
  notes: text('notes'),
  isArchived: integer('is_archived').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/**
 * petty_cash_entry — double-entry journal line.
 * Every transaction produces exactly two rows: one DEBIT, one CREDIT.
 * The pair shares the same `txn_ref` UUID.
 *
 * Typical flow:
 *   Replenishment  → DR Cash / CR Bank
 *   Expense        → DR Expense / CR Cash
 *   Correction     → DR/CR as needed
 */
export const pettyCashEntry = pgTable('petty_cash_entry', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => pettyCashAccount.id, { onDelete: 'cascade' }),
  txnRef: varchar('txn_ref', { length: 36 }).notNull(),          // UUID shared by the debit+credit pair
  entryDate: date('entry_date', { mode: 'date' }).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  category: varchar('category', { length: 100 }).notNull().default('General'),
  debit: decimal('debit', { precision: 12, scale: 2 }).notNull().default('0'),   // money IN to cash fund
  credit: decimal('credit', { precision: 12, scale: 2 }).notNull().default('0'), // money OUT of cash fund
  runningBalance: decimal('running_balance', { precision: 12, scale: 2 }).notNull().default('0'),
  reference: varchar('reference', { length: 255 }),               // receipt / voucher number
  createdBy: varchar('created_by', { length: 255 }),
  isArchived: integer('is_archived').notNull().default(0),
  archiveRef: varchar('archive_ref', { length: 100 }),            // e.g. "2025-Q1"
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const payslip = pgTable('payslip', {
  id: serial('id').primaryKey(),
  timeclockEntryId: integer('timeclock_entry_id').notNull().references(() => timeclockEntry.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 100 }).notNull().default(''),
  lastName: varchar('last_name', { length: 100 }).notNull().default(''),
  employeeName: varchar('employee_name', { length: 255 }).notNull(),
  department: varchar('department', { length: 100 }).notNull(),
  position: varchar('position', { length: 100 }).notNull(),
  payPeriodStart: date('pay_period_start', { mode: 'date' }).notNull(),
  payPeriodEnd: date('pay_period_end', { mode: 'date' }).notNull(),
  regularHours: decimal('regular_hours', { precision: 8, scale: 2 }).notNull(),
  overtimeHours: decimal('overtime_hours', { precision: 8, scale: 2 }).notNull(),
  holidayHours: decimal('holiday_hours', { precision: 8, scale: 2 }).notNull(),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }).notNull(),
  regularPay: decimal('regular_pay', { precision: 10, scale: 2 }).notNull(),
  overtimePay: decimal('overtime_pay', { precision: 10, scale: 2 }).notNull(),
  holidayPay: decimal('holiday_pay', { precision: 10, scale: 2 }).notNull(),
  allowances: decimal('allowances', { precision: 10, scale: 2 }).notNull().default('0'),
  grossPay: decimal('gross_pay', { precision: 10, scale: 2 }).notNull(),
  nisEmployee: decimal('nis_employee', { precision: 10, scale: 2 }).notNull(),
  nisEmployer: decimal('nis_employer', { precision: 10, scale: 2 }).notNull(),
  payeTax: decimal('paye_tax', { precision: 10, scale: 2 }).notNull(),
  totalDeductions: decimal('total_deductions', { precision: 10, scale: 2 }).notNull(),
  netPay: decimal('net_pay', { precision: 10, scale: 2 }).notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Previously created only by MySQL startup SQL.
export const nisRate = pgTable('nis_rate', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull().unique(),
  employeeRate: decimal('employee_rate', { precision: 5, scale: 4 }).notNull(),
  employerRate: decimal('employer_rate', { precision: 5, scale: 4 }).notNull(),
  effectiveNote: varchar('effective_note', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
export const employeeDeduction = pgTable('employee_deduction', {
  id: serial('id').primaryKey(),
  employeeName: varchar('employee_name', { length: 255 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  isRecurring: integer('is_recurring').notNull().default(1),
  payPeriodStart: date('pay_period_start', { mode: 'date' }),
  payPeriodEnd: date('pay_period_end', { mode: 'date' }),
  effectiveDate: date('effective_date', { mode: 'date' }),
  endDate: date('end_date', { mode: 'date' }),
  notes: varchar('notes', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
