-- Migration: Add section field to books and partial payment fields to orders
-- Run this SQL on your MySQL database

-- Add section column to books table
ALTER TABLE books ADD COLUMN section VARCHAR(50) NULL AFTER featured;

-- Add partial payment columns to orders table
ALTER TABLE orders ADD COLUMN onlineAmount DECIMAL(10, 2) NULL AFTER total;
ALTER TABLE orders ADD COLUMN codAmount DECIMAL(10, 2) NULL AFTER onlineAmount;

-- Create index on section for faster filtering
CREATE INDEX idx_books_section ON books(section);
