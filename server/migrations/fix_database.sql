-- Complete Database Migration Fix
-- Run this SQL to fix the 503 error

-- 1. Add section column to books table (if not exists)
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'books' AND column_name = 'section' AND table_schema = DATABASE());
SET @sql := IF(@exist = 0, 'ALTER TABLE books ADD COLUMN section VARCHAR(50) NULL AFTER featured', 'SELECT "section column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Add partial payment columns to orders table (if not exists)
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'onlineAmount' AND table_schema = DATABASE());
SET @sql := IF(@exist = 0, 'ALTER TABLE orders ADD COLUMN onlineAmount DECIMAL(10, 2) NULL AFTER total', 'SELECT "onlineAmount column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'codAmount' AND table_schema = DATABASE());
SET @sql := IF(@exist = 0, 'ALTER TABLE orders ADD COLUMN codAmount DECIMAL(10, 2) NULL AFTER onlineAmount', 'SELECT "codAmount column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(191) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT NULL,
    discountType ENUM('PERCENTAGE', 'FIXED') NOT NULL DEFAULT 'PERCENTAGE',
    discountValue DECIMAL(10, 2) NOT NULL,
    minOrderAmount DECIMAL(10, 2) NULL,
    maxDiscount DECIMAL(10, 2) NULL,
    maxUses INT NULL,
    usedCount INT NOT NULL DEFAULT 0,
    validFrom DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    validUntil DATETIME(3) NULL,
    isActive BOOLEAN NOT NULL DEFAULT true,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY code (code),
    KEY idx_active_dates (isActive, validFrom, validUntil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Success message
SELECT 'Database migration completed successfully!' as message;
