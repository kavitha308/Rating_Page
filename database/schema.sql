-- =============================================================================
-- STORE RATING PLATFORM - DATABASE SCHEMA
-- Database Engine: MySQL 8.0+
-- Storage Engine: InnoDB
-- Character Set: utf8mb4 / utf8mb4_unicode_ci
-- =============================================================================

CREATE DATABASE IF NOT EXISTS store_rating_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE store_rating_db;

-- -----------------------------------------------------------------------------
-- Clean up existing tables (ordered by foreign key dependency hierarchy)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS users;

-- =============================================================================
-- 1. USERS TABLE
-- Stores administrative personnel, store owners, and normal consumers.
-- =============================================================================
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT,
    name VARCHAR(60) NOT NULL,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address VARCHAR(400) NOT NULL,
    role ENUM('ADMIN', 'USER', 'STORE_OWNER') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Primary Key
    CONSTRAINT pk_users PRIMARY KEY (id),

    -- Unique Constraints
    CONSTRAINT uq_users_email UNIQUE (email),

    -- Domain & Length Validations
    CONSTRAINT chk_users_name_len CHECK (CHAR_LENGTH(name) >= 20 AND CHAR_LENGTH(name) <= 60),
    CONSTRAINT chk_users_address_len CHECK (CHAR_LENGTH(address) <= 400),

    -- Performance Indexes
    INDEX idx_users_name (name),
    INDEX idx_users_role (role),
    INDEX idx_users_address (address(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. STORES TABLE
-- Stores physical and online store listings, optionally assigned to a store owner.
-- =============================================================================
CREATE TABLE stores (
    id INT UNSIGNED AUTO_INCREMENT,
    name VARCHAR(60) NOT NULL,
    email VARCHAR(191) NOT NULL,
    address VARCHAR(400) NOT NULL,
    owner_id INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Primary Key
    CONSTRAINT pk_stores PRIMARY KEY (id),

    -- Constraints: At most one store per store owner
    CONSTRAINT uq_stores_owner UNIQUE (owner_id),

    -- Foreign Key Constraint
    -- If a user is removed, preserve the store listing by setting owner_id to NULL
    CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id)
        REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- Domain & Length Validations
    CONSTRAINT chk_stores_name_len CHECK (CHAR_LENGTH(name) >= 20 AND CHAR_LENGTH(name) <= 60),
    CONSTRAINT chk_stores_address_len CHECK (CHAR_LENGTH(address) <= 400),

    -- Performance Indexes
    INDEX idx_stores_name (name),
    INDEX idx_stores_email (email),
    INDEX idx_stores_address (address(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. RATINGS TABLE
-- Stores individual consumer feedback scores (1-5 integer stars).
-- Enforces strictly 1 rating per (user, store) pair.
-- =============================================================================
CREATE TABLE ratings (
    id INT UNSIGNED AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    store_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Primary Key
    CONSTRAINT pk_ratings PRIMARY KEY (id),

    -- Critical Constraint: Prevents duplicate ratings by the same user for the same store
    CONSTRAINT uq_ratings_user_store UNIQUE (user_id, store_id),

    -- Domain Rating Range Validation (1 to 5 integer)
    CONSTRAINT chk_ratings_value CHECK (rating >= 1 AND rating <= 5),

    -- Foreign Keys with Cascade Delete
    -- If a user or store is deleted, related rating records are automatically cleaned up
    CONSTRAINT fk_ratings_user FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_ratings_store FOREIGN KEY (store_id)
        REFERENCES stores (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Performance Indexes
    INDEX idx_ratings_store_id (store_id),
    INDEX idx_ratings_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
