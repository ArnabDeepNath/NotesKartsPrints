-- Create Coupons Table
-- Run this in phpMyAdmin SQL tab

CREATE TABLE IF NOT EXISTS `coupons` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `discountType` ENUM('PERCENTAGE', 'FIXED') NOT NULL DEFAULT 'PERCENTAGE',
  `discountValue` DECIMAL(10, 2) NOT NULL,
  `minOrderAmount` DECIMAL(10, 2) NULL,
  `maxDiscount` DECIMAL(10, 2) NULL,
  `maxUses` INT NULL,
  `usedCount` INT NOT NULL DEFAULT 0,
  `validFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `validUntil` DATETIME(3) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_code_key` (`code`),
  KEY `coupons_code_idx` (`code`),
  KEY `coupons_isActive_validFrom_validUntil_idx` (`isActive`, `validFrom`, `validUntil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
