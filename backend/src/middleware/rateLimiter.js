const rateLimit = require('express-rate-limit');
const { query } = require('../config/database');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict login rate limiter - max 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Custom middleware to check recent failed attempts from database
const checkRecentFailedAttempts = async (req, res, next) => {
  try {
    const { username } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!username) {
      return next();
    }

    // Check for failed attempts in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const result = await query(
      `SELECT COUNT(*) as attempt_count 
       FROM login_attempts 
       WHERE username = $1 
       AND success = false 
       AND attempt_time > $2`,
      [username, fifteenMinutesAgo]
    );

    const failedAttempts = parseInt(result.rows[0].attempt_count);

    if (failedAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts. Please try again after 15 minutes.'
      });
    }

    // Attach client IP to request for logging
    req.clientIp = clientIp;
    next();
  } catch (err) {
    console.error('Error checking failed attempts:', err);
    next();
  }
};

module.exports = {
  apiLimiter,
  loginLimiter,
  checkRecentFailedAttempts
};
