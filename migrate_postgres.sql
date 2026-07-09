-- ============================================================
-- PostgreSQL full schema migration
-- Converts the entire MySQL schema (Laravel + custom tables)
-- to PostgreSQL-compatible SQL.
--
-- Safe to run on a FRESH database OR on a database that
-- already has some/all Laravel migrations applied.
-- Handles all 34 Laravel migrations + custom tables.
-- ============================================================

-- 0. Essential base tables (if running on a fresh database)
-- ------------------------------------------------------------------

-- migrations table (Laravel needs this)
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    migration VARCHAR(255) NOT NULL UNIQUE,
    batch INTEGER NOT NULL
);

-- users table (all other tables reference this)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- password_resets table
CREATE TABLE IF NOT EXISTS password_resets (
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS password_resets_email_index ON password_resets (email);

-- personal_access_tokens table
CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT NULL,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS personal_access_tokens_tokenable_index ON personal_access_tokens (tokenable_type, tokenable_id);

-- 1. Add email_verified_at column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL;

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL DEFAULT '',
    middle_initial VARCHAR(1) NULL,
    last_name VARCHAR(255) NOT NULL DEFAULT '',
    suffix VARCHAR(20) NULL,
    fullname VARCHAR(255) NOT NULL DEFAULT '',
    google_id VARCHAR(255) NULL,
    archived_at TIMESTAMP NULL,
    avatar TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS profiles_user_id_index ON profiles (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_google_id_unique ON profiles (google_id) WHERE google_id IS NOT NULL;

-- 3. Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    icon VARCHAR(255) NULL,
    sort_order INTEGER DEFAULT 0,
    archived_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE (user_id, name)
);

-- 4. Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    initial_balance NUMERIC(15,2) DEFAULT 0.00,
    balance NUMERIC(15,2) DEFAULT 0.00,
    icon VARCHAR(255) NULL,
    sort_order INTEGER DEFAULT 0,
    archived_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE (user_id, name)
);

-- 5. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id BIGINT NULL REFERENCES accounts(id) ON DELETE SET NULL,
    category_id BIGINT NULL REFERENCES categories(id) ON DELETE SET NULL,
    to_account_id BIGINT NULL REFERENCES accounts(id) ON DELETE SET NULL,
    type VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    description TEXT NULL,
    date DATE NOT NULL,
    is_source SMALLINT DEFAULT 1,
    archived_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS transactions_user_id_date_index ON transactions (user_id, date);
CREATE INDEX IF NOT EXISTS transactions_user_id_archived_at_index ON transactions (user_id, archived_at);

-- 6. Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT NULL REFERENCES categories(id) ON DELETE SET NULL,
    limit_amount NUMERIC(15,2) NOT NULL,
    period VARCHAR(255) DEFAULT 'monthly',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE (user_id, category_id)
);

-- 7. Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS activity_logs_user_id_index ON activity_logs (user_id);
CREATE INDEX IF NOT EXISTS activity_logs_action_index ON activity_logs (action);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_index ON activity_logs (created_at);

-- 8. Create verification_codes table
CREATE TABLE IF NOT EXISTS verification_codes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- 9. Create budget_plans table
CREATE TABLE IF NOT EXISTS budget_plans (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    budget NUMERIC(15,2) DEFAULT 0.00,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER DEFAULT 1,
    color VARCHAR(50) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS budget_plans_user_id_year_month_index ON budget_plans (user_id, year, month);

-- 10. Create budget_plan_items table
CREATE TABLE IF NOT EXISTS budget_plan_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    budget_plan_id BIGINT NOT NULL REFERENCES budget_plans(id) ON DELETE CASCADE,
    name VARCHAR(255) NULL,
    category VARCHAR(255) NULL,
    type VARCHAR(255) DEFAULT 'Expense',
    notes TEXT NULL,
    amount NUMERIC(15,2) DEFAULT 0.00,
    date TIMESTAMP NOT NULL,
    archived SMALLINT DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS budget_plan_items_plan_id_archived_index ON budget_plan_items (budget_plan_id, archived);

-- 11. Create dashboard_cards table (final state: without icon column)
CREATE TABLE IF NOT EXISTS dashboard_cards (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_type VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255) NULL,
    sort_order INTEGER DEFAULT 0,
    settings JSONB NULL,
    is_visible SMALLINT DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS dashboard_cards_user_id_sort_order_index ON dashboard_cards (user_id, sort_order);
-- Drop icon column if it somehow exists
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dashboard_cards' AND column_name = 'icon') THEN
        ALTER TABLE dashboard_cards DROP COLUMN icon;
    END IF;
END $$;

-- 12. Create deletion_reasons table
CREATE TABLE IF NOT EXISTS deletion_reasons (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email VARCHAR(255) NOT NULL,
    reason TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- 13. Add google_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique ON users (google_id) WHERE google_id IS NOT NULL;

-- 14. Add archived_at column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL;

-- 15. Drop columns from users that were moved to profiles
-- These might already be gone if the migration has run
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users DROP COLUMN first_name;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users DROP COLUMN last_name;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'middle_initial') THEN
        ALTER TABLE users DROP COLUMN middle_initial;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'suffix') THEN
        ALTER TABLE users DROP COLUMN suffix;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'fullname') THEN
        ALTER TABLE users DROP COLUMN fullname;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_id') THEN
        ALTER TABLE users DROP COLUMN google_id;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'archived_at') THEN
        ALTER TABLE users DROP COLUMN archived_at;
    END IF;
END $$;

-- ============================================================
-- 16. Data migration from old finance_sheet tables
-- Only runs if the old tables exist (skipped on fresh database)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'finance_sheet_rows') THEN

        -- 16a. Profiles: create a profile for every existing user
        INSERT INTO profiles (user_id, first_name, middle_initial, last_name, suffix, fullname, created_at, updated_at)
        SELECT id, COALESCE(first_name, 'User'), middle_initial, COALESCE(last_name, ''),
               suffix, COALESCE(fullname, first_name, 'User'), NOW(), NOW()
        FROM users
        ON CONFLICT DO NOTHING;

        -- 16b. Categories: copy from Categories sheet rows
        INSERT INTO categories (user_id, name, type, sort_order, created_at, updated_at)
        SELECT
            fs.user_id,
            TRIM(fsr.data->>fsc_cat.column_key),
            LOWER(TRIM(fsr.data->>fsc_type.column_key)),
            0, NOW(), NOW()
        FROM finance_sheet_rows fsr
        JOIN finance_sheets fs ON fs.id = fsr.finance_sheet_id
        JOIN finance_sheet_columns fsc_cat ON fsc_cat.finance_sheet_id = fs.id AND fsc_cat.name = 'Category Name'
        JOIN finance_sheet_columns fsc_type ON fsc_type.finance_sheet_id = fs.id AND fsc_type.name = 'Type'
        WHERE fs.name = 'Categories' AND fsr.archived_at IS NULL
        ON CONFLICT DO NOTHING;

        -- 16c. Accounts: copy from Accounts sheet rows
        INSERT INTO accounts (user_id, name, initial_balance, balance, icon, sort_order, created_at, updated_at)
        SELECT
            fs.user_id,
            TRIM(fsr.data->>fsc_name.column_key),
            COALESCE((fsr.data->>fsc_init.column_key)::numeric, 0),
            COALESCE((fsr.data->>fsc_bal.column_key)::numeric, 0),
            fsr.data->>fsc_icon.column_key,
            0, NOW(), NOW()
        FROM finance_sheet_rows fsr
        JOIN finance_sheets fs ON fs.id = fsr.finance_sheet_id
        JOIN finance_sheet_columns fsc_name ON fsc_name.finance_sheet_id = fs.id AND fsc_name.name = 'Account Name'
        JOIN finance_sheet_columns fsc_init ON fsc_init.finance_sheet_id = fs.id AND fsc_init.name = 'Initial Amount'
        JOIN finance_sheet_columns fsc_bal ON fsc_bal.finance_sheet_id = fs.id AND fsc_bal.name = 'Balance'
        LEFT JOIN finance_sheet_columns fsc_icon ON fsc_icon.finance_sheet_id = fs.id AND fsc_icon.name = 'Icon'
        WHERE fs.name = 'Accounts' AND fsr.archived_at IS NULL
        ON CONFLICT DO NOTHING;

        -- 16d. Transactions: copy from Records sheet rows
        INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, date, created_at, updated_at)
        SELECT
            fs.user_id,
            acc.id,
            cat.id,
            LOWER(TRIM(fsr.data->>fsc_type.column_key)),
            COALESCE((fsr.data->>fsc_amt.column_key)::numeric, 0),
            fsr.data->>fsc_desc.column_key,
            (fsr.data->>fsc_date.column_key)::date,
            NOW(), NOW()
        FROM finance_sheet_rows fsr
        JOIN finance_sheets fs ON fs.id = fsr.finance_sheet_id
        JOIN finance_sheet_columns fsc_type ON fsc_type.finance_sheet_id = fs.id AND fsc_type.name = 'Type'
        JOIN finance_sheet_columns fsc_amt ON fsc_amt.finance_sheet_id = fs.id AND fsc_amt.name = 'Amount'
        JOIN finance_sheet_columns fsc_date ON fsc_date.finance_sheet_id = fs.id AND fsc_date.name = 'Date'
        LEFT JOIN finance_sheet_columns fsc_desc ON fsc_desc.finance_sheet_id = fs.id AND fsc_desc.name = 'Description'
        LEFT JOIN finance_sheet_columns fsc_cat ON fsc_cat.finance_sheet_id = fs.id AND fsc_cat.name = 'Category'
        LEFT JOIN finance_sheet_columns fsc_acc ON fsc_acc.finance_sheet_id = fs.id AND fsc_acc.name = 'Account'
        LEFT JOIN accounts acc ON acc.user_id = fs.user_id AND acc.name = TRIM(fsr.data->>fsc_acc.column_key)
        LEFT JOIN categories cat ON cat.user_id = fs.user_id AND cat.name = TRIM(fsr.data->>fsc_cat.column_key)
        WHERE fs.name = 'Records' AND fsr.archived_at IS NULL;

        -- 16e. Budgets: copy from Budget sheet rows
        INSERT INTO budgets (user_id, category_id, limit_amount, period, created_at, updated_at)
        SELECT
            fs.user_id,
            cat.id,
            COALESCE((fsr.data->>fsc_lim.column_key)::numeric, 0),
            'monthly', NOW(), NOW()
        FROM finance_sheet_rows fsr
        JOIN finance_sheets fs ON fs.id = fsr.finance_sheet_id
        JOIN finance_sheet_columns fsc_cat ON fsc_cat.finance_sheet_id = fs.id AND fsc_cat.name = 'Category'
        JOIN finance_sheet_columns fsc_lim ON fsc_lim.finance_sheet_id = fs.id AND fsc_lim.name = 'Limit'
        LEFT JOIN categories cat ON cat.user_id = fs.user_id AND cat.name = TRIM(fsr.data->>fsc_cat.column_key)
        WHERE fs.name = 'Budget' AND fsr.archived_at IS NULL
        ON CONFLICT DO NOTHING;

    END IF;
END $$;

-- 17. Drop old finance_sheet tables (if they exist)
DROP TABLE IF EXISTS finance_sheet_rows;
DROP TABLE IF EXISTS finance_sheet_columns;
DROP TABLE IF EXISTS finance_sheets;

-- 18. Record migrations so Laravel knows they've been run
INSERT INTO migrations (migration, batch) VALUES
('2026_06_29_035657_add_email_verified_at_to_users_table', 4),
('2026_06_29_051854_create_dedicated_tables', 4),
('2026_06_29_061000_cleanup_tables', 5),
('2026_06_29_061500_create_dashboard_cards_table', 5),
('2026_06_29_062000_remove_icon_from_dashboard_cards', 5),
('2026_06_29_063000_create_budget_plans_tables', 6),
('2026_06_29_064000_create_deletion_reasons_table', 7),
('2026_06_29_065000_add_google_id_to_users_table', 7),
('2026_06_29_070000_create_activity_logs_table', 8),
('2026_06_29_071000_add_archived_at_to_users_table', 8),
('2026_06_30_130000_move_user_fields_to_profiles', 9),
('2026_07_01_105400_create_verification_codes_table', 9),
('2026_07_02_000001_add_avatar_to_profiles_table', 9),
('2026_07_02_100633_add_to_account_id_to_transactions_table', 10),
('2026_07_02_145136_add_colors_to_budget_plans_table', 10),
('2026_07_02_190000_add_is_source_to_transactions_table', 11),
('2026_07_02_200000_fix_existing_transfer_transactions', 11),
('2026_07_02_210000_fix_transfer_is_source_properly', 11),
('2026_07_02_220000_fix_transfer_is_source_flag_again', 12)
ON CONFLICT (migration) DO NOTHING;
