let sqlite3 = null;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (err) {
  console.warn('[Notice] Native sqlite3 binary could not be loaded:', err.message);
  console.log('[Notice] Activating Pure JavaScript In-Memory Database Engine.');
}

const { createPureMemoryDb } = require('./pureMemoryDb');

let dbInstance = null;

const createSqliteAdapter = () => {
  if (dbInstance) return dbInstance;

  if (!sqlite3) {
    dbInstance = createPureMemoryDb();
    return dbInstance;
  }

  let db = null;
  try {
    db = new sqlite3.Database(':memory:');
  } catch (err) {
    console.warn('[Notice] sqlite3 memory DB initialization failed, falling back to Pure Memory DB:', err.message);
    dbInstance = createPureMemoryDb();
    return dbInstance;
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // Initialize schema
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        address TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'USER',
        created_at DATETIME DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now'))
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT NOT NULL,
        owner_id INTEGER,
        created_at DATETIME DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now')),
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        created_at DATETIME DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now')),
        UNIQUE(user_id, store_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Seed realistic accounts matching database/seed.sql
    // Passwords: Admin@1234, Owner@1234, User@1234
    const adminHash = '$2b$10$LiqRSCJiBEVtEyckrP4ZSOoUyrjm47TzhDz9IzfYKxISMsp2cAGS6';
    const ownerHash = '$2b$10$7MkyPW7JIPeyD8nXtQaV1e56wzC./Lw0WKfUp9SYAqo4CTcxdKID2';
    const userHash  = '$2b$10$W3m.KeMWMSqxcZh5TQ8MWeoo2Q1nAL260eGnq/oDP0IP8zJafLX4a';

    const insertUser = db.prepare('INSERT INTO users (id, name, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?, ?)');
    insertUser.run(1, 'Administrator Super Master', 'admin@storerating.com', adminHash, '100 Corporate Boulevard, Suite 500, Tech District, Metropolis', 'ADMIN');
    insertUser.run(2, 'Christopher James Harrington', 'harrington@storerating.com', ownerHash, '42 Market Street, Commercial Arcade, Downtown Financial City', 'STORE_OWNER');
    insertUser.run(3, 'Eleanor Beatrice Montgomery', 'montgomery@storerating.com', ownerHash, '88 Elmwood Avenue, Suite 12B, Uptown Arts Quarter, North Valley', 'STORE_OWNER');
    insertUser.run(4, 'Guillermo Francisco Rodriguez', 'rodriguez@storerating.com', ownerHash, '150 Pacific Coast Highway, Unit 4, Harbor View, South Bay', 'STORE_OWNER');
    insertUser.run(5, 'Victoria Alexandria Pemberton', 'pemberton@storerating.com', ownerHash, '304 Royal Crest Boulevard, Garden District, Metro Central', 'STORE_OWNER');
    insertUser.run(6, 'Jonathan Edward Higginsworth', 'jonathan.higgins@example.com', userHash, '12 Willowbrook Terrace, Apartment 3A, West End, Greenfield', 'USER');
    insertUser.run(7, 'Bartholomew Christopher Davis', 'bart.davis@example.com', userHash, '455 Sunnyside Way, Residential Block 9, Eastside Heights', 'USER');
    insertUser.run(8, 'Anastasia Catherine Romanov', 'anastasia.romanov@example.com', userHash, '789 Birchwood Lane, Suite 101, Oakmont Gardens, Highland Park', 'USER');
    insertUser.run(9, 'Zachary Nathaniel Kensington', 'zach.kensington@example.com', userHash, '67 Maple Ridge Crossing, Tower B, Midtown Lake District', 'USER');
    insertUser.run(10, 'Madeline Sophia Abernathy', 'madeline.abernathy@example.com', userHash, '210 Silver Spring Court, Building 5, Riverfront Crossing', 'USER');
    insertUser.finalize();

    const insertStore = db.prepare('INSERT INTO stores (id, name, email, address, owner_id) VALUES (?, ?, ?, ?, ?)');
    insertStore.run(1, 'Apex Organic Gourmet Supermarket', 'contact@apexorganic.com', '42 Market Street, Commercial Arcade, Downtown Financial City', 2);
    insertStore.run(2, 'Heritage Artisan Coffee Roasters', 'hello@heritageartisancoffee.com', '88 Elmwood Avenue, Suite 12B, Uptown Arts Quarter, North Valley', 3);
    insertStore.run(3, 'Pacific Coastal Tech & Gadgets', 'support@pacificcoasttech.com', '150 Pacific Coast Highway, Unit 4, Harbor View, South Bay', 4);
    insertStore.run(4, 'Royal Sapphire Luxury Department Store', 'concierge@royalsapphirestore.com', '304 Royal Crest Boulevard, Garden District, Metro Central', 5);
    insertStore.run(5, 'Zenith Electronics & Home Automation', 'info@zenithelectronics.com', '512 Innovation Parkway, Technology Center, Cyber Valley', null);
    insertStore.finalize();

    const insertRating = db.prepare('INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)');
    // Store 1: avg 4.5
    insertRating.run(6, 1, 5);
    insertRating.run(7, 1, 4);
    insertRating.run(9, 1, 5);
    insertRating.run(10, 1, 4);
    // Store 2: avg 4.5
    insertRating.run(6, 2, 4);
    insertRating.run(7, 2, 5);
    insertRating.run(8, 2, 5);
    insertRating.run(10, 2, 4);
    // Store 3: avg 3.67
    insertRating.run(6, 3, 3);
    insertRating.run(8, 3, 4);
    insertRating.run(9, 3, 4);
    // Store 4: avg 4.0
    insertRating.run(7, 4, 5);
    insertRating.run(8, 4, 4);
    insertRating.run(9, 4, 3);
    // Store 5: avg 2.5
    insertRating.run(8, 5, 2);
    insertRating.run(10, 5, 3);
    insertRating.finalize();
  });

  const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      // Translate MySQL specific syntax to SQLite
      let normalizedSql = sql
        .replace(/NOW\(\)/gi, "datetime('now')");

      const trimmed = normalizedSql.trim().toUpperCase();
      const isSelect = trimmed.startsWith('SELECT');

      if (isSelect) {
        db.all(normalizedSql, params, (err, rows) => {
          if (err) return reject(mapError(err));
          resolve([rows, []]);
        });
      } else {
        db.run(normalizedSql, params, function (err) {
          if (err) return reject(mapError(err));
          resolve([{ insertId: this.lastID, affectedRows: this.changes }, []]);
        });
      }
    });
  };

  const mapError = (err) => {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      const e = new Error('Duplicate entry');
      e.code = 'ER_DUP_ENTRY';
      e.sqlMessage = err.message;
      return e;
    }
    if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
      const e = new Error('Foreign key violation');
      e.code = 'ER_NO_REFERENCED_ROW_2';
      e.sqlMessage = err.message;
      return e;
    }
    return err;
  };

  dbInstance = {
    query,
    withTransaction: async (cb) => cb({ query }),
    testConnection: async () => ({ connected: true, result: 2 }),
    pool: { end: async () => new Promise((res) => db.close(res)) }
  };

  return dbInstance;
};

module.exports = { createSqliteAdapter };
