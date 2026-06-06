-- ============================================================
-- SALES ORDER ACCOUNTING INFORMATION SYSTEM
-- Complete Database Schema - MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS sales_order_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sales_order_db;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin','manager','accountant','sales_staff') DEFAULT 'sales_staff',
  phone VARCHAR(20),
  avatar VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  password_reset_token VARCHAR(255),
  password_reset_expires DATETIME,
  refresh_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

CREATE TABLE categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE customers (
  id CHAR(36) PRIMARY KEY,
  customer_code VARCHAR(20) UNIQUE,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Nigeria',
  credit_limit DECIMAL(15,2) DEFAULT 0,
  outstanding_balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_phone (phone)
);

CREATE TABLE products (
  id CHAR(36) PRIMARY KEY,
  product_code VARCHAR(30) UNIQUE,
  sku VARCHAR(50) UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id CHAR(36),
  cost_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(15,2) NOT NULL,
  quantity INT DEFAULT 0,
  min_stock_level INT DEFAULT 10,
  supplier VARCHAR(200),
  unit VARCHAR(20) DEFAULT 'piece',
  image VARCHAR(255),
  barcode VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_sku (sku),
  INDEX idx_name (name),
  INDEX idx_quantity (quantity)
);

CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY,
  order_number VARCHAR(30) UNIQUE NOT NULL,
  customer_id CHAR(36) NOT NULL,
  created_by CHAR(36),
  status ENUM('pending','confirmed','paid','delivered','cancelled') DEFAULT 'pending',
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount_type ENUM('percentage','fixed') DEFAULT 'fixed',
  discount_value DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  balance_due DECIMAL(15,2) DEFAULT 0,
  payment_method ENUM('cash','bank_transfer','card','credit','cheque'),
  notes TEXT,
  delivery_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_customer (customer_id),
  INDEX idx_created_at (created_at)
);

CREATE TABLE order_items (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  product_name VARCHAR(200),
  quantity INT NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  cost_price DECIMAL(15,2),
  discount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE invoices (
  id CHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  order_id CHAR(36),
  customer_id CHAR(36),
  issued_by CHAR(36),
  status ENUM('draft','sent','paid','overdue','cancelled') DEFAULT 'draft',
  subtotal DECIMAL(15,2),
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2),
  amount_paid DECIMAL(15,2) DEFAULT 0,
  balance_due DECIMAL(15,2),
  due_date DATETIME,
  notes TEXT,
  pdf_path VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_customer (customer_id)
);

CREATE TABLE transactions (
  id CHAR(36) PRIMARY KEY,
  reference VARCHAR(50) UNIQUE,
  type ENUM('sale','payment','refund','expense','adjustment'),
  order_id CHAR(36),
  customer_id CHAR(36),
  amount DECIMAL(15,2) NOT NULL,
  payment_method ENUM('cash','bank_transfer','card','credit','cheque'),
  description TEXT,
  recorded_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
);

CREATE TABLE expenses (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  recorded_by CHAR(36),
  receipt VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_date (date),
  INDEX idx_category (category)
);

CREATE TABLE inventory_logs (
  id CHAR(36) PRIMARY KEY,
  product_id CHAR(36),
  type ENUM('sale','restock','adjustment','return','damage'),
  quantity_change INT NOT NULL,
  quantity_before INT,
  quantity_after INT,
  reference_id CHAR(36),
  notes TEXT,
  recorded_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_product (product_id)
);

CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','warning','success','error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read)
);

CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50),
  entity_id CHAR(36),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_entity (entity, entity_id),
  INDEX idx_created_at (created_at)
);
