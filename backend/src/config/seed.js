const bcrypt = require('bcrypt');
const { pool } = require('./database');

const SALT_ROUNDS = 12;

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if data already exists
    const existingUsers = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('Database already seeded. Skipping...');
      await client.query('COMMIT');
      return;
    }

    console.log('Seeding users...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('Admin@123', SALT_ROUNDS);
    const adminResult = await client.query(
      `INSERT INTO users (username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['admin', adminPassword, 'admin', true]
    );
    console.log('Admin user created: admin / Admin@123');

    // Create investor user
    const investorPassword = await bcrypt.hash('Investor@123', SALT_ROUNDS);
    const investorResult = await client.query(
      `INSERT INTO users (username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['john.doe', investorPassword, 'investor', true]
    );
    const investorId = investorResult.rows[0].id;
    console.log('Investor user created: john.doe / Investor@123');

    console.log('Seeding share prices...');
    
    // Create sample share prices
    const shares = [
      { name: 'AAPL', price: 195.50 },
      { name: 'GOOGL', price: 142.30 },
      { name: 'MSFT', price: 378.90 },
      { name: 'AMZN', price: 155.20 },
      { name: 'TSLA', price: 248.70 }
    ];

    for (const share of shares) {
      await client.query(
        `INSERT INTO share_prices (share_name, current_price) VALUES ($1, $2)`,
        [share.name, share.price]
      );
    }
    console.log('Share prices seeded successfully');

    console.log('Seeding investor portfolio...');
    
    // Create sample investor portfolio
    const portfolios = [
      { company: 'Apple Inc.', firm: 'Tech Investments LLC', share: 'AAPL', quantity: 100, buyPrice: 180.00 },
      { company: 'Alphabet Inc.', firm: 'Tech Investments LLC', share: 'GOOGL', quantity: 50, buyPrice: 135.00 },
      { company: 'Microsoft Corp.', firm: 'Tech Investments LLC', share: 'MSFT', quantity: 75, buyPrice: 350.00 }
    ];

    for (const portfolio of portfolios) {
      await client.query(
        `INSERT INTO investors (user_id, company_name, firm_name, share_name, share_quantity, buy_price) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [investorId, portfolio.company, portfolio.firm, portfolio.share, portfolio.quantity, portfolio.buyPrice]
      );
    }
    console.log('Investor portfolio seeded successfully');

    await client.query('COMMIT');
    console.log('\n========================================');
    console.log('Seed completed successfully!');
    console.log('========================================');
    console.log('Default Credentials:');
    console.log('-------------------');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: Admin@123');
    console.log('');
    console.log('Investor:');
    console.log('  Username: john.doe');
    console.log('  Password: Investor@123');
    console.log('========================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
};

seedData();
