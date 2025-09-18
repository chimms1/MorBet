CREATE DATABASE IF NOT EXISTS vuln_app;
USE vuln_app;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  wallet INT DEFAULT 0
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255),
  message TEXT
);

CREATE USER 'vuln_appuser'@'localhost' IDENTIFIED BY 'vuln_app123';
GRANT ALL PRIVILEGES ON vuln_app.* TO 'vuln_appuser'@'localhost';
FLUSH PRIVILEGES;