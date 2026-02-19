const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { generateToken } = require('../utils/jwt');
const { query } = require('../config/database');

const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;
    const clientIp = req.clientIp || req.ip || 'unknown';

    // Find user by username
    const result = await query(
      'SELECT id, username, password_hash, role, is_active FROM users WHERE username = $1',
      [username]
    );

    // Log login attempt
    const logAttempt = async (success) => {
      await query(
        'INSERT INTO login_attempts (username, ip_address, success) VALUES ($1, $2, $3)',
        [username, clientIp, success]
      );
    };

    if (result.rows.length === 0) {
      await logAttempt(false);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      await logAttempt(false);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      await logAttempt(false);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Log successful login
    await logAttempt(true);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
};

const logout = async (req, res) => {
  try {
    // In a stateless JWT system, we rely on client-side token removal
    // For enhanced security, we could implement a token blacklist here
    
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during logout.'
    });
  }
};

const validateToken = async (req, res) => {
  try {
    // The authenticate middleware already validated the token
    // and attached user info to req.user
    
    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });
  } catch (err) {
    console.error('Token validation error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during token validation.'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, role, is_active, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

module.exports = {
  login,
  logout,
  validateToken,
  getProfile
};
