-- MySQL-ONLY! Do NOT run on PostgreSQL. Use migrate_postgres.sql instead.
-- Run these SQL statements in phpMyAdmin for epawn.unaux.com

-- 1. Add email_verified_at column to users table
ALTER TABLE `users` ADD COLUMN `email_verified_at` TIMESTAMP NULL DEFAULT NULL AFTER `email`;

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS `profiles` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `first_name` VARCHAR(255) NOT NULL,
    `middle_initial` VARCHAR(1) NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `suffix` VARCHAR(20) NULL,
    `fullname` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create categories table
CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL COMMENT 'income / expense',
    `icon` VARCHAR(255) NULL,
    `sort_order` INT UNSIGNED DEFAULT 0,
    `archived_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `categories_user_id_name_unique` (`user_id`, `name`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create accounts table
CREATE TABLE IF NOT EXISTS `accounts` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `initial_balance` DECIMAL(15,2) DEFAULT 0.00,
    `balance` DECIMAL(15,2) DEFAULT 0.00,
    `icon` VARCHAR(255) NULL,
    `sort_order` INT UNSIGNED DEFAULT 0,
    `archived_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `accounts_user_id_name_unique` (`user_id`, `name`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create transactions table
CREATE TABLE IF NOT EXISTS `transactions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `account_id` BIGINT UNSIGNED NULL,
    `category_id` BIGINT UNSIGNED NULL,
    `type` VARCHAR(255) NOT NULL COMMENT 'income / expense / transfer',
    `amount` DECIMAL(15,2) NOT NULL,
    `description` TEXT NULL,
    `date` DATE NOT NULL,
    `archived_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    INDEX `transactions_user_id_date_index` (`user_id`, `date`),
    INDEX `transactions_user_id_archived_at_index` (`user_id`, `archived_at`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create budgets table
CREATE TABLE IF NOT EXISTS `budgets` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `category_id` BIGINT UNSIGNED NULL,
    `limit_amount` DECIMAL(15,2) NOT NULL,
    `period` VARCHAR(255) DEFAULT 'monthly' COMMENT 'monthly / weekly / yearly',
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `budgets_user_id_category_id_unique` (`user_id`, `category_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Migrate existing user data from old finance_sheet tables
-- Run these in order if your old data should be copied

-- 7a. Profiles: create a profile for every existing user
INSERT IGNORE INTO `profiles` (`user_id`, `first_name`, `middle_initial`, `last_name`, `suffix`, `fullname`, `created_at`, `updated_at`)
SELECT `id`, COALESCE(`first_name`, 'User'), `middle_initial`, COALESCE(`last_name`, ''), `suffix`, COALESCE(`fullname`, `first_name`, 'User'), NOW(), NOW()
FROM `users`;

-- 7b. Categories: copy from Categories sheet rows
INSERT INTO `categories` (`user_id`, `name`, `type`, `sort_order`, `created_at`, `updated_at`)
SELECT 
    fs.user_id,
    TRIM(JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_cat.column_key)))),
    LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_type.column_key))))),
    0,
    NOW(),
    NOW()
FROM `finance_sheet_rows` fsr
JOIN `finance_sheets` fs ON fs.id = fsr.finance_sheet_id
JOIN `finance_sheet_columns` fsc_cat ON fsc_cat.finance_sheet_id = fs.id AND fsc_cat.name = 'Category Name'
JOIN `finance_sheet_columns` fsc_type ON fsc_type.finance_sheet_id = fs.id AND fsc_type.name = 'Type'
WHERE fs.name = 'Categories' AND fsr.archived_at IS NULL;

-- 7c. Accounts: copy from Accounts sheet rows
INSERT INTO `accounts` (`user_id`, `name`, `initial_balance`, `balance`, `icon`, `sort_order`, `created_at`, `updated_at`)
SELECT 
    fs.user_id,
    TRIM(JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_name.column_key)))),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_init.column_key))), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_bal.column_key))), 0),
    JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_icon.column_key))),
    0,
    NOW(),
    NOW()
FROM `finance_sheet_rows` fsr
JOIN `finance_sheets` fs ON fs.id = fsr.finance_sheet_id
JOIN `finance_sheet_columns` fsc_name ON fsc_name.finance_sheet_id = fs.id AND fsc_name.name = 'Account Name'
JOIN `finance_sheet_columns` fsc_init ON fsc_init.finance_sheet_id = fs.id AND fsc_init.name = 'Initial Amount'
JOIN `finance_sheet_columns` fsc_bal ON fsc_bal.finance_sheet_id = fs.id AND fsc_bal.name = 'Balance'
LEFT JOIN `finance_sheet_columns` fsc_icon ON fsc_icon.finance_sheet_id = fs.id AND fsc_icon.name = 'Icon'
WHERE fs.name = 'Accounts' AND fsr.archived_at IS NULL;

-- 7d. Transactions: copy from Records sheet rows
INSERT INTO `transactions` (`user_id`, `account_id`, `category_id`, `type`, `amount`, `description`, `date`, `created_at`, `updated_at`)
SELECT 
    fs.user_id,
    acc.id,
    cat.id,
    LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_type.column_key))))),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_amt.column_key))), 0),
    JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_desc.column_key))),
    JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_date.column_key))),
    NOW(),
    NOW()
FROM `finance_sheet_rows` fsr
JOIN `finance_sheets` fs ON fs.id = fsr.finance_sheet_id
JOIN `finance_sheet_columns` fsc_type ON fsc_type.finance_sheet_id = fs.id AND fsc_type.name = 'Type'
JOIN `finance_sheet_columns` fsc_amt ON fsc_amt.finance_sheet_id = fs.id AND fsc_amt.name = 'Amount'
JOIN `finance_sheet_columns` fsc_date ON fsc_date.finance_sheet_id = fs.id AND fsc_date.name = 'Date'
LEFT JOIN `finance_sheet_columns` fsc_desc ON fsc_desc.finance_sheet_id = fs.id AND fsc_desc.name = 'Description'
LEFT JOIN `finance_sheet_columns` fsc_cat ON fsc_cat.finance_sheet_id = fs.id AND fsc_cat.name = 'Category'
LEFT JOIN `finance_sheet_columns` fsc_acc ON fsc_acc.finance_sheet_id = fs.id AND fsc_acc.name = 'Account'
LEFT JOIN `accounts` acc ON acc.user_id = fs.user_id AND acc.name = TRIM(JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_acc.column_key))))
LEFT JOIN `categories` cat ON cat.user_id = fs.user_id AND cat.name = TRIM(JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_cat.column_key))))
WHERE fs.name = 'Records' AND fsr.archived_at IS NULL;

-- 7e. Budgets: copy from Budget sheet rows
INSERT INTO `budgets` (`user_id`, `category_id`, `limit_amount`, `period`, `created_at`, `updated_at`)
SELECT 
    fs.user_id,
    cat.id,
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_lim.column_key))), 0),
    'monthly',
    NOW(),
    NOW()
FROM `finance_sheet_rows` fsr
JOIN `finance_sheets` fs ON fs.id = fsr.finance_sheet_id
JOIN `finance_sheet_columns` fsc_cat ON fsc_cat.finance_sheet_id = fs.id AND fsc_cat.name = 'Category'
JOIN `finance_sheet_columns` fsc_lim ON fsc_lim.finance_sheet_id = fs.id AND fsc_lim.name = 'Limit'
LEFT JOIN `categories` cat ON cat.user_id = fs.user_id AND cat.name = TRIM(JSON_UNQUOTE(JSON_EXTRACT(fsr.data, CONCAT('$.', fsc_cat.column_key))))
WHERE fs.name = 'Budget' AND fsr.archived_at IS NULL;

-- 8. Drop old finance_sheet tables (data already migrated above)
DROP TABLE IF EXISTS `finance_sheet_rows`;
DROP TABLE IF EXISTS `finance_sheet_columns`;
DROP TABLE IF EXISTS `finance_sheets`;

-- 9. Drop unused failed_jobs table
DROP TABLE IF EXISTS `failed_jobs`;

-- 10. Create budget_plans and budget_plan_items tables
CREATE TABLE IF NOT EXISTS `budget_plans` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `budget` DECIMAL(15,2) DEFAULT 0.00,
    `year` INT NOT NULL,
    `month` INT NOT NULL,
    `day` INT DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    INDEX `budget_plans_user_id_year_month_index` (`user_id`, `year`, `month`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `budget_plan_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `budget_plan_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NULL,
    `category` VARCHAR(255) NULL,
    `type` VARCHAR(255) DEFAULT 'Expense',
    `notes` TEXT NULL,
    `amount` DECIMAL(15,2) DEFAULT 0.00,
    `date` DATETIME NOT NULL,
    `archived` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    INDEX `budget_plan_items_plan_id_archived_index` (`budget_plan_id`, `archived`),
    FOREIGN KEY (`budget_plan_id`) REFERENCES `budget_plans`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Create dashboard_cards table
CREATE TABLE IF NOT EXISTS `dashboard_cards` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `card_type` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `sort_order` INT UNSIGNED DEFAULT 0,
    `settings` JSON NULL,
    `is_visible` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    INDEX `dashboard_cards_user_id_sort_order_index` (`user_id`, `sort_order`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Record migrations so Laravel knows they've been run
INSERT IGNORE INTO `migrations` (`migration`, `batch`) VALUES
('2026_06_29_035657_add_email_verified_at_to_users_table', 4),
('2026_06_29_051854_create_dedicated_tables', 4),
('2026_06_29_061000_cleanup_tables', 5),
('2026_06_29_061500_create_dashboard_cards_table', 5),
('2026_06_29_062000_remove_icon_from_dashboard_cards', 5),
('2026_06_29_063000_create_budget_plans_tables', 6),
('2026_06_29_064000_create_deletion_reasons_table', 7),
('2026_06_29_065000_add_google_id_to_users_table', 7);

-- 13. Add google_id column to users table (for Google Sign-In tracking)
ALTER TABLE `users` ADD COLUMN `google_id` VARCHAR(255) NULL UNIQUE AFTER `id`;

-- 14. Create deletion_reasons table
CREATE TABLE IF NOT EXISTS `deletion_reasons` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL,
    `reason` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
