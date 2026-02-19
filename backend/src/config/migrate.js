const { pool } = require('./database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'investor')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating investors table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS investors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(100) NOT NULL,
        firm_name VARCHAR(100) NOT NULL,
        share_name VARCHAR(50) NOT NULL,
        share_quantity INTEGER NOT NULL CHECK (share_quantity > 0),
        buy_price DECIMAL(10, 2) NOT NULL CHECK (buy_price > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating share_prices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS share_prices (
        id SERIAL PRIMARY KEY,
        share_name VARCHAR(50) UNIQUE NOT NULL,
        current_price DECIMAL(10, 2) NOT NULL CHECK (current_price >= 0),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating login_attempts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN NOT NULL
      )
    `);

    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_investors_user_id ON investors(user_id);
      CREATE INDEX IF NOT EXISTS idx_share_prices_name ON share_prices(share_name);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempt_time);
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
};

createTables();
