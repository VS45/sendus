const { rateLimit } = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many authentication attempts. Please try again later.',
});

module.exports = { authLimiter };
