const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { query } = require('../config/database');

const SALT_ROUNDS = 12;

// User Management
const getAllUsers = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        u.id,
        u.username,
        u.role,
        u.is_active,
        u.created_at,
        COUNT(i.id) as holdings_count
       FROM users u
       LEFT JOIN investors i ON u.id = i.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      data: {
        users: result.rows
      }
    });
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users.'
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await query(
      `SELECT 
        u.id,
        u.username,
        u.role,
        u.is_active,
        u.created_at
       FROM users u
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Get user's holdings if they are an investor
    const holdingsResult = await query(
      `SELECT 
        i.id,
        i.company_name,
        i.firm_name,
        i.share_name,
        i.share_quantity,
        i.buy_price,
        sp.current_price
       FROM investors i
       LEFT JOIN share_prices sp ON i.share_name = sp.share_name
       WHERE i.user_id = $1`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        user: result.rows[0],
        holdings: holdingsResult.rows
      }
    });
  } catch (err) {
    console.error('Get user by id error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user.'
    });
  }
};

const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, password, role, company_name, firm_name } = req.body;

    // Check if username already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userResult = await query(
      `INSERT INTO users (username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4) RETURNING id, username, role, is_active, created_at`,
      [username, passwordHash, role, true]
    );

    const newUser = userResult.rows[0];

    // If role is investor and company/firm info provided, create investor record
    if (role === 'investor' && company_name && firm_name) {
      await query(
        `INSERT INTO investors (user_id, company_name, firm_name, share_name, share_quantity, buy_price) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newUser.id, company_name, firm_name, 'TEMP', 0, 0]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: {
        user: newUser
      }
    });
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating user.'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.params.id;
    const { is_active, password } = req.body;

    // Check if user exists
    const userResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    let updateQuery = 'UPDATE users SET ';
    const updateValues = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      updateQuery += `is_active = $${paramCount}, `;
      updateValues.push(is_active);
      paramCount++;
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      updateQuery += `password_hash = $${paramCount}, `;
      updateValues.push(passwordHash);
      paramCount++;
    }

    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = $${paramCount} RETURNING id, username, role, is_active, created_at`;
    updateValues.push(userId);

    const result = await query(updateQuery, updateValues);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: {
        user: result.rows[0]
      }
    });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating user.'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting yourself
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account.'
      });
    }

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting user.'
    });
  }
};

// Share Price Management
const getAllSharePrices = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        id,
        share_name,
        current_price,
        updated_at
       FROM share_prices
       ORDER BY share_name ASC`
    );

    return res.status(200).json({
      success: true,
      data: {
        sharePrices: result.rows
      }
    });
  } catch (err) {
    console.error('Get all share prices error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching share prices.'
    });
  }
};

const createSharePrice = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { share_name, current_price } = req.body;

    // Check if share already exists
    const existingShare = await query(
      'SELECT id FROM share_prices WHERE share_name = $1',
      [share_name]
    );

    if (existingShare.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Share price already exists for this symbol.'
      });
    }

    const result = await query(
      `INSERT INTO share_prices (share_name, current_price) 
       VALUES ($1, $2) RETURNING id, share_name, current_price, updated_at`,
      [share_name, current_price]
    );

    return res.status(201).json({
      success: true,
      message: 'Share price created successfully.',
      data: {
        sharePrice: result.rows[0]
      }
    });
  } catch (err) {
    console.error('Create share price error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating share price.'
    });
  }
};

const updateSharePrice = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const shareId = req.params.id;
    const { current_price } = req.body;

    const result = await query(
      `UPDATE share_prices 
       SET current_price = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, share_name, current_price, updated_at`,
      [current_price, shareId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Share price not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Share price updated successfully.',
      data: {
        sharePrice: result.rows[0]
      }
    });
  } catch (err) {
    console.error('Update share price error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating share price.'
    });
  }
};

const deleteSharePrice = async (req, res) => {
  try {
    const shareId = req.params.id;

    const result = await query(
      'DELETE FROM share_prices WHERE id = $1 RETURNING id',
      [shareId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Share price not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Share price deleted successfully.'
    });
  } catch (err) {
    console.error('Delete share price error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting share price.'
    });
  }
};

// Investor Holdings Management
const getAllHoldings = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        i.id,
        i.user_id,
        u.username,
        i.company_name,
        i.firm_name,
        i.share_name,
        i.share_quantity,
        i.buy_price,
        i.created_at,
        sp.current_price
       FROM investors i
       JOIN users u ON i.user_id = u.id
       LEFT JOIN share_prices sp ON i.share_name = sp.share_name
       ORDER BY i.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      data: {
        holdings: result.rows
      }
    });
  } catch (err) {
    console.error('Get all holdings error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching holdings.'
    });
  }
};

const createHolding = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { user_id, company_name, firm_name, share_name, share_quantity, buy_price } = req.body;

    // Check if user exists and is an investor
    const userResult = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (userResult.rows[0].role !== 'investor') {
      return res.status(400).json({
        success: false,
        message: 'Holdings can only be created for investor users.'
      });
    }

    const result = await query(
      `INSERT INTO investors (user_id, company_name, firm_name, share_name, share_quantity, buy_price) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, user_id, company_name, firm_name, share_name, share_quantity, buy_price, created_at`,
      [user_id, company_name, firm_name, share_name, share_quantity, buy_price]
    );

    return res.status(201).json({
      success: true,
      message: 'Holding created successfully.',
      data: {
        holding: result.rows[0]
      }
    });
  } catch (err) {
    console.error('Create holding error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating holding.'
    });
  }
};

const updateHolding = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const holdingId = req.params.id;
    const { share_quantity, buy_price } = req.body;

    let updateQuery = 'UPDATE investors SET ';
    const updateValues = [];
    let paramCount = 1;

    if (share_quantity !== undefined) {
      updateQuery += `share_quantity = $${paramCount}, `;
      updateValues.push(share_quantity);
      paramCount++;
    }

    if (buy_price !== undefined) {
      updateQuery += `buy_price = $${paramCount}, `;
      updateValues.push(buy_price);
      paramCount++;
    }

    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = $${paramCount} RETURNING id, user_id, company_name, firm_name, share_name, share_quantity, buy_price, created_at`;
    updateValues.push(holdingId);

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Holding updated successfully.',
      data: {
        holding: result.rows[0]
      }
    });
  } catch (err) {
    console.error('Update holding error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating holding.'
    });
  }
};

const deleteHolding = async (req, res) => {
  try {
    const holdingId = req.params.id;

    const result = await query(
      'DELETE FROM investors WHERE id = $1 RETURNING id',
      [holdingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Holding deleted successfully.'
    });
  } catch (err) {
    console.error('Delete holding error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting holding.'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllSharePrices,
  createSharePrice,
  updateSharePrice,
  deleteSharePrice,
  getAllHoldings,
  createHolding,
  updateHolding,
  deleteHolding
};
