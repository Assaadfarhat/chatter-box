const mysql = require('mysql2');
require('dotenv').config();

const isProduction = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chatterbox',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(isProduction && { ssl: { rejectUnauthorized: false } })
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to MySQL database');
    connection.release();
  }
});

module.exports = pool.promise();
