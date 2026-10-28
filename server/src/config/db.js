const mysql = require('mysql2/promise');
const config = require('./env');

let pool = null;
let dbInterface = null;

// Default to SQLite unless explicitly set to USE_SQLITE=false
const useMysql = process.env.USE_SQLITE === 'false';

if (!useMysql || config.nodeEnv === 'test') {
  const { createSqliteAdapter } = require('./sqliteAdapter');
  dbInterface = createSqliteAdapter();
} else {
  // Production MySQL connection pool
  pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    timezone: 'Z'
  });

  const query = async (sql, params = []) => {
    return await pool.execute(sql, params);
  };

  const withTransaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };

  const testConnection = async () => {
    try {
      const [result] = await pool.query('SELECT 1 + 1 AS health_check');
      return {
        connected: true,
        result: result[0].health_check
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  };

  dbInterface = {
    pool,
    query,
    withTransaction,
    testConnection
  };
}

module.exports = dbInterface;
