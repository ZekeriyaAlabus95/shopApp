-- Database schema for Shop Admin with multi-user support
-- Run this script to create the necessary tables

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL -- store hashed passwords
);

-- Sources table (suppliers/vendors) - now user-specific
CREATE TABLE IF NOT EXISTS source (
    source_id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    address TEXT,
    name TEXT,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Products table - now user-specific
CREATE TABLE IF NOT EXISTS product (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT UNIQUE,
    price REAL,
    date_accepted TEXT,
    product_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    source_id INTEGER NOT NULL,
    category TEXT,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (source_id) REFERENCES source(source_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Transactions table for sales records
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,            -- links to users
    source_id INTEGER,          -- links to source
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL NOT NULL,
    type TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (source_id) REFERENCES source(source_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Transaction items table for individual items in transactions
CREATE TABLE IF NOT EXISTS transaction_item (
    transaction_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, -- new column for multi-user isolation
    quantity INTEGER NOT NULL DEFAULT 1,
    price REAL NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_user_id ON product(user_id);
CREATE INDEX IF NOT EXISTS idx_product_barcode ON product(barcode);
CREATE INDEX IF NOT EXISTS idx_source_user_id ON source(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_item_user_id ON transaction_item(user_id);
