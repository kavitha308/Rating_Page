-- =============================================================================
-- STORE RATING PLATFORM - SEED DATA
-- Purpose: Realistic mock dataset for development, testing, and grading.
--
-- TEST CREDENTIALS CHEAT SHEET:
-- -----------------------------------------------------------------------------
-- Admin:        admin@storerating.com         | Password: Admin@1234
-- Store Owner:  harrington@storerating.com    | Password: Owner@1234
-- Store Owner:  montgomery@storerating.com    | Password: Owner@1234
-- Store Owner:  rodriguez@storerating.com     | Password: Owner@1234
-- Store Owner:  pemberton@storerating.com     | Password: Owner@1234
-- Normal User:  jonathan.higgins@example.com  | Password: User@1234
-- Normal User:  bart.davis@example.com        | Password: User@1234
-- Normal User:  anastasia.romanov@example.com | Password: User@1234
-- Normal User:  zach.kensington@example.com   | Password: User@1234
-- Normal User:  madeline.abernathy@example.com| Password: User@1234
-- =============================================================================

USE store_rating_db;

-- Disable foreign key checks during clean re-seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE ratings;
TRUNCATE TABLE stores;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. SEED USERS
-- Password hashes generated via bcrypt (cost factor: 10):
-- Admin@1234 -> $2b$10$LiqRSCJiBEVtEyckrP4ZSOoUyrjm47TzhDz9IzfYKxISMsp2cAGS6
-- Owner@1234 -> $2b$10$7MkyPW7JIPeyD8nXtQaV1e56wzC./Lw0WKfUp9SYAqo4CTcxdKID2
-- User@1234  -> $2b$10$W3m.KeMWMSqxcZh5TQ8MWeoo2Q1nAL260eGnq/oDP0IP8zJafLX4a
-- =============================================================================
INSERT INTO users (id, name, email, password_hash, address, role, created_at, updated_at) VALUES
-- Admin User
(1, 'Administrator Super Master', 'admin@storerating.com', '$2b$10$LiqRSCJiBEVtEyckrP4ZSOoUyrjm47TzhDz9IzfYKxISMsp2cAGS6', '100 Corporate Boulevard, Suite 500, Tech District, Metropolis', 'ADMIN', NOW(), NOW()),

-- Store Owners
(2, 'Christopher James Harrington', 'harrington@storerating.com', '$2b$10$7MkyPW7JIPeyD8nXtQaV1e56wzC./Lw0WKfUp9SYAqo4CTcxdKID2', '42 Market Street, Commercial Arcade, Downtown Financial City', 'STORE_OWNER', NOW(), NOW()),
(3, 'Eleanor Beatrice Montgomery', 'montgomery@storerating.com', '$2b$10$7MkyPW7JIPeyD8nXtQaV1e56wzC./Lw0WKfUp9SYAqo4CTcxdKID2', '88 Elmwood Avenue, Suite 12B, Uptown Arts Quarter, North Valley', 'STORE_OWNER', NOW(), NOW()),
(4, 'Guillermo Francisco Rodriguez', 'rodriguez@storerating.com', '$2b$10$7MkyPW7JIPeyD8nXtQaV1e56wzC./Lw0WKfUp9SYAqo4CTcxdKID2', '150 Pacific Coast Highway, Unit 4, Harbor View, South Bay', 'STORE_OWNER', NOW(), NOW()),
(5, 'Victoria Alexandria Pemberton', 'pemberton@storerating.com', '$2b$10$7MkyPW7JIPeyD8nXtQaV1e56wzC./Lw0WKfUp9SYAqo4CTcxdKID2', '304 Royal Crest Boulevard, Garden District, Metro Central', 'STORE_OWNER', NOW(), NOW()),

-- Normal Users
(6, 'Jonathan Edward Higginsworth', 'jonathan.higgins@example.com', '$2b$10$W3m.KeMWMSqxcZh5TQ8MWeoo2Q1nAL260eGnq/oDP0IP8zJafLX4a', '12 Willowbrook Terrace, Apartment 3A, West End, Greenfield', 'USER', NOW(), NOW()),
(7, 'Bartholomew Christopher Davis', 'bart.davis@example.com', '$2b$10$W3m.KeMWMSqxcZh5TQ8MWeoo2Q1nAL260eGnq/oDP0IP8zJafLX4a', '455 Sunnyside Way, Residential Block 9, Eastside Heights', 'USER', NOW(), NOW()),
(8, 'Anastasia Catherine Romanov', 'anastasia.romanov@example.com', '$2b$10$W3m.KeMWMSqxcZh5TQ8MWeoo2Q1nAL260eGnq/oDP0IP8zJafLX4a', '789 Birchwood Lane, Suite 101, Oakmont Gardens, Highland Park', 'USER', NOW(), NOW()),
(9, 'Zachary Nathaniel Kensington', 'zach.kensington@example.com', '$2b$10$W3m.KeMWMSqxcZh5TQ8MWeoo2Q1nAL260eGnq/oDP0IP8zJafLX4a', '67 Maple Ridge Crossing, Tower B, Midtown Lake District', 'USER', NOW(), NOW()),
(10, 'Madeline Sophia Abernathy', 'madeline.abernathy@example.com', '$2b$10$W3m.KeMWMSqxcZh5TQ8MWeoo2Q1nAL260eGnq/oDP0IP8zJafLX4a', '210 Silver Spring Court, Building 5, Riverfront Crossing', 'USER', NOW(), NOW());

-- =============================================================================
-- 2. SEED STORES
-- Note: Store names comply with the 20-60 character length requirement.
-- Four stores are assigned to Store Owners; Store 5 is unassigned to test admin assignment.
-- =============================================================================
INSERT INTO stores (id, name, email, address, owner_id, created_at, updated_at) VALUES
(1, 'Apex Organic Gourmet Supermarket', 'contact@apexorganic.com', '42 Market Street, Commercial Arcade, Downtown Financial City', 2, NOW(), NOW()),
(2, 'Heritage Artisan Coffee Roasters', 'hello@heritageartisancoffee.com', '88 Elmwood Avenue, Suite 12B, Uptown Arts Quarter, North Valley', 3, NOW(), NOW()),
(3, 'Pacific Coastal Tech & Gadgets', 'support@pacificcoasttech.com', '150 Pacific Coast Highway, Unit 4, Harbor View, South Bay', 4, NOW(), NOW()),
(4, 'Royal Sapphire Luxury Department Store', 'concierge@royalsapphirestore.com', '304 Royal Crest Boulevard, Garden District, Metro Central', 5, NOW(), NOW()),
(5, 'Zenith Electronics & Home Automation', 'info@zenithelectronics.com', '512 Innovation Parkway, Technology Center, Cyber Valley', NULL, NOW(), NOW());

-- =============================================================================
-- 3. SEED RATINGS
-- Diverse scores submitted by normal users (IDs 6-10) for stores (IDs 1-5).
-- Complies with UNIQUE (user_id, store_id) and rating range [1-5].
-- =============================================================================
INSERT INTO ratings (user_id, store_id, rating, created_at, updated_at) VALUES
-- Ratings for Store 1 (Apex Organic) -> Average: (5 + 4 + 5 + 4) / 4 = 4.5
(6, 1, 5, NOW(), NOW()),
(7, 1, 4, NOW(), NOW()),
(9, 1, 5, NOW(), NOW()),
(10, 1, 4, NOW(), NOW()),

-- Ratings for Store 2 (Heritage Coffee) -> Average: (4 + 5 + 5 + 4) / 4 = 4.5
(6, 2, 4, NOW(), NOW()),
(7, 2, 5, NOW(), NOW()),
(8, 2, 5, NOW(), NOW()),
(10, 2, 4, NOW(), NOW()),

-- Ratings for Store 3 (Pacific Coastal Tech) -> Average: (3 + 4 + 4) / 3 = 3.67
(6, 3, 3, NOW(), NOW()),
(8, 3, 4, NOW(), NOW()),
(9, 3, 4, NOW(), NOW()),

-- Ratings for Store 4 (Royal Sapphire) -> Average: (5 + 4 + 3) / 3 = 4.0
(7, 4, 5, NOW(), NOW()),
(8, 4, 4, NOW(), NOW()),
(9, 4, 3, NOW(), NOW()),

-- Ratings for Store 5 (Zenith Electronics) -> Average: (2 + 3) / 2 = 2.5
(8, 5, 2, NOW(), NOW()),
(10, 5, 3, NOW(), NOW());
