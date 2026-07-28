const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../controllers/auth.controller');
const { ensureGuest, ensureAuthenticated } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimits');

router.get('/register', ensureGuest, auth.getRegister);
router.post('/register', authLimiter, ensureGuest, [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be between 2 and 120 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
], auth.register);
router.get('/login', ensureGuest, auth.getLogin);
router.post('/login', authLimiter, ensureGuest, body('email').isEmail().normalizeEmail(), auth.login);
router.post('/logout', ensureAuthenticated, auth.logout);

module.exports = router;
