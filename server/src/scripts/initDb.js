const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config/env');

const runSqlFile = async (filePath) => {
  console.log(`Reading SQL file: ${filePath}...`);
  const sql = fs.readFileSync(filePath, 'utf8');

  // Create temporary connection with multipleStatements enabled
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true
  });

  try {
    console.log(`Executing SQL script on host ${config.db.host}:${config.db.port}...`);
    await connection.query(sql);
    console.log(`Successfully executed: ${path.basename(filePath)}`);
  } finally {
    await connection.end();
  }
};

const main = async () => {
  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

  if (process.env.USE_SQLITE === 'true') {
    console.log('--- Database Setup: In-Memory SQLite Mode Active ---');
    console.log('USE_SQLITE=true is configured. The in-memory database initializes and seeds automatically on server startup.');
    console.log('To initialize a persistent MySQL 8.0+ database instead, set USE_SQLITE=false in server/.env with your MySQL credentials.');
    process.exit(0);
  }

  try {
    console.log('--- Initializing MySQL Database Schema ---');
    await runSqlFile(schemaPath);

    console.log('--- Seeding MySQL Database with Demo Data ---');
    await runSqlFile(seedPath);

    console.log('--- MySQL Database Setup Completed Successfully! ---');
    process.exit(0);
  } catch (error) {
    console.error('\n[Notice] Could not connect to local MySQL service:', error.message);
    console.log('Tip: If you do not have a local MySQL 8.0 instance running, you can enable zero-config mode by setting:');
    console.log('      USE_SQLITE=true');
    console.log('in your server/.env file. The application will start immediately with complete in-memory seed data.');
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { runSqlFile };
