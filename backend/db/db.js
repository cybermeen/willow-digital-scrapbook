const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Test the connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully!');
    client.release();
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
})();

// The "Standard" way to export for a Multi-User app
module.exports = {
  query: (text, params) => pool.query(text, params),
};