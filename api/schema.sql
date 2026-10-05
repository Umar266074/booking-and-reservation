-- Clean schema for the Booking & Reservation system (MySQL 8 / MariaDB 10).
-- Usage:  CREATE DATABASE booking_system;  USE booking_system;  SOURCE schema.sql;
-- Tests load this same file into the separate `booking_system_test` database.

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('customer','provider','admin') NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resources (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  owner_id      INT,
  name          VARCHAR(150) NOT NULL,
  description   VARCHAR(255),
  capacity      INT NOT NULL DEFAULT 1,
  duration_minutes INT NOT NULL DEFAULT 30,          -- default slot length, minutes
  is_active     BOOLEAN DEFAULT TRUE,             -- inactive = hidden from customers, not deleted
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS availability (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  resource_id   INT NOT NULL,
  day_of_week   TINYINT NULL DEFAULT 0,           -- 0-6 (Sun-Sat), weekly window (not used by booking check yet)
  specific_date DATE NULL,                        -- date-specific window (used by booking check)
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  FOREIGN KEY (resource_id) REFERENCES resources(id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  resource_id   INT NOT NULL,
  user_id       INT NOT NULL,
  specific_date DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  status        ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  FOREIGN KEY (resource_id) REFERENCES resources(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_booking_lookup (resource_id, specific_date, start_time, end_time)
);
