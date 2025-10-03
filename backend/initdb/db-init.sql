-- backend/initdb/db-init.sql
CREATE DATABASE IF NOT EXISTS vuln_app;
USE vuln_app;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  usertype ENUM('normal','pro') DEFAULT 'normal',
  wallet INT DEFAULT 0
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255),
  message TEXT
);

-- -- Optional: transactions table (if you want later)
-- CREATE TABLE IF NOT EXISTS transactions (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   username VARCHAR(255),
--   account VARCHAR(255),
--   amount INT,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Create application user (grants)
CREATE USER IF NOT EXISTS 'vuln_appuser'@'%' IDENTIFIED BY 'vuln_app123';
GRANT ALL PRIVILEGES ON vuln_app.* TO 'vuln_appuser'@'%';
FLUSH PRIVILEGES;

-- Seed some example users/comments
INSERT IGNORE INTO users (username, password, usertype, wallet) VALUES
  ('bee', 'buggy', 'normal', 100),
  ('bob', 'bobpass', 'pro', 500),
  ('attacker', 'x', 'normal', 50);

INSERT IGNORE INTO comments (username, message) VALUES
  ('alice', 'Hello world!');
