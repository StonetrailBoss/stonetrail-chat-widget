CREATE TABLE "account" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts_payable" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor" varchar(255) NOT NULL,
	"description" text,
	"amount" numeric(12, 2) NOT NULL,
	"bill_date" date,
	"due_date" date NOT NULL,
	"date_paid" date,
	"category" varchar(100) DEFAULT 'General' NOT NULL,
	"status" varchar(50) DEFAULT 'unpaid' NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
	"reconciled" integer DEFAULT 0 NOT NULL,
	"bank_transaction_id" varchar(255),
	"bank_transaction_date" date,
	"bank_transaction_note" text,
	"receipt_filename" varchar(500),
	"receipt_url" varchar(1000),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"action" varchar(100) NOT NULL,
	"item_id" integer,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_deduction" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_name" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"is_recurring" integer DEFAULT 1 NOT NULL,
	"pay_period_start" date,
	"pay_period_end" date,
	"effective_date" date,
	"end_date" date,
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_rate" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"employee_name" varchar(255) NOT NULL,
	"department" varchar(100) DEFAULT 'General' NOT NULL,
	"position" varchar(100) DEFAULT 'Staff' NOT NULL,
	"hourly_rate" numeric(10, 2) NOT NULL,
	"allowances" numeric(10, 2) DEFAULT '0' NOT NULL,
	"bank_name" varchar(255),
	"bank_account" varchar(100),
	"bank_routing" varchar(50),
	"nis_exempt" integer DEFAULT 0 NOT NULL,
	"is_archived" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_rate_employee_name_unique" UNIQUE("employee_name")
);
--> statement-breakpoint
CREATE TABLE "inventory_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"qcid" varchar(20),
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"unit" varchar(50) DEFAULT 'units' NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	"description" text,
	"notes" text,
	"image_url" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nis_rate" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"employee_rate" numeric(5, 4) NOT NULL,
	"employer_rate" numeric(5, 4) NOT NULL,
	"effective_note" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nis_rate_year_unique" UNIQUE("year")
);
--> statement-breakpoint
CREATE TABLE "payable_payment" (
	"id" serial PRIMARY KEY NOT NULL,
	"payable_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date_paid" date NOT NULL,
	"method" varchar(100),
	"reference" varchar(255),
	"notes" text,
	"receipt_filename" varchar(500),
	"receipt_url" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslip" (
	"id" serial PRIMARY KEY NOT NULL,
	"timeclock_entry_id" integer NOT NULL,
	"first_name" varchar(100) DEFAULT '' NOT NULL,
	"last_name" varchar(100) DEFAULT '' NOT NULL,
	"employee_name" varchar(255) NOT NULL,
	"department" varchar(100) NOT NULL,
	"position" varchar(100) NOT NULL,
	"pay_period_start" date NOT NULL,
	"pay_period_end" date NOT NULL,
	"regular_hours" numeric(8, 2) NOT NULL,
	"overtime_hours" numeric(8, 2) NOT NULL,
	"holiday_hours" numeric(8, 2) NOT NULL,
	"hourly_rate" numeric(10, 2) NOT NULL,
	"regular_pay" numeric(10, 2) NOT NULL,
	"overtime_pay" numeric(10, 2) NOT NULL,
	"holiday_pay" numeric(10, 2) NOT NULL,
	"allowances" numeric(10, 2) DEFAULT '0' NOT NULL,
	"gross_pay" numeric(10, 2) NOT NULL,
	"nis_employee" numeric(10, 2) NOT NULL,
	"nis_employer" numeric(10, 2) NOT NULL,
	"paye_tax" numeric(10, 2) NOT NULL,
	"total_deductions" numeric(10, 2) NOT NULL,
	"net_pay" numeric(10, 2) NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "petty_cash_account" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"opening_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"current_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'EC$' NOT NULL,
	"notes" text,
	"is_archived" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "petty_cash_entry" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"txn_ref" varchar(36) NOT NULL,
	"entry_date" date NOT NULL,
	"description" varchar(500) NOT NULL,
	"category" varchar(100) DEFAULT 'General' NOT NULL,
	"debit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"running_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"reference" varchar(255),
	"created_by" varchar(255),
	"is_archived" integer DEFAULT 0 NOT NULL,
	"archive_ref" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" varchar(36) NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "staff_role" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"tab_permissions" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_role_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "timeclock_entry" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) DEFAULT '' NOT NULL,
	"last_name" varchar(100) DEFAULT '' NOT NULL,
	"employee_name" varchar(255) NOT NULL,
	"department" varchar(100) DEFAULT 'General' NOT NULL,
	"position" varchar(100) DEFAULT 'Staff' NOT NULL,
	"pay_period_start" date NOT NULL,
	"pay_period_end" date NOT NULL,
	"regular_hours" numeric(8, 2) DEFAULT '0' NOT NULL,
	"overtime_hours" numeric(8, 2) DEFAULT '0' NOT NULL,
	"holiday_hours" numeric(8, 2) DEFAULT '0' NOT NULL,
	"hourly_rate" numeric(10, 2) NOT NULL,
	"allowances" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"bank_name" varchar(255),
	"bank_account" varchar(100),
	"bank_routing" varchar(50),
	"pay_date" date,
	"nis_exempt" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" varchar(50) DEFAULT 'staff',
	"staff_role_id" varchar(36),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payable_payment" ADD CONSTRAINT "payable_payment_payable_id_accounts_payable_id_fk" FOREIGN KEY ("payable_id") REFERENCES "public"."accounts_payable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_timeclock_entry_id_timeclock_entry_id_fk" FOREIGN KEY ("timeclock_entry_id") REFERENCES "public"."timeclock_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_entry" ADD CONSTRAINT "petty_cash_entry_account_id_petty_cash_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."petty_cash_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;