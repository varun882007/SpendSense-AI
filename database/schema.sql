-- SpendSense AI Database Schema
-- Note: The application uses SQLAlchemy ORM to manage tables automatically.
-- This file documents the schema for reference.

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    preferred_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    is_default BOOLEAN NOT NULL DEFAULT 0,
    user_id INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    transaction_type VARCHAR(20) NOT NULL,
    original_amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    converted_amount DECIMAL(12,2),
    display_currency VARCHAR(10),
    exchange_rate DECIMAL(12,6),
    exchange_rate_timestamp DATETIME,
    description VARCHAR(500) NOT NULL,
    notes TEXT,
    transaction_date DATE NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT 0,
    recurring_frequency VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(200) NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    deadline DATE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    frequency VARCHAR(50) NOT NULL,
    next_payment_date DATE,
    category_id INTEGER REFERENCES categories(id),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(12,6) NOT NULL,
    fetched_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS shared_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    description VARCHAR(500) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    split_type VARCHAR(50) NOT NULL DEFAULT 'equal',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared_expense_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shared_expense_id INTEGER NOT NULL REFERENCES shared_expenses(id),
    member_name VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_user ON savings_goals(user_id);
