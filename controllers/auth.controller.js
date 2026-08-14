const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User'); // Adjust path as needed

exports.getRegister = (req, res) => {
  res.render('register', { title: 'Register' });
}

exports.getLogin = (req, res) => {
  res.render('login', { title: 'Login' });
}

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('register', { 
        title: 'Create account', 
        form: req.body, 
        validationErrors: errors.array() 
      });
    }
    
    const email = req.body.email.toLowerCase().trim();
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(422).render('register', { 
        title: 'Create account', 
        form: req.body, 
        validationErrors: [{ msg: 'An account with this email already exists.' }] 
      });
    }
    
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    await User.create({ 
      name: req.body.name.trim(), 
      email, 
      passwordHash, 
      role: 'client', 
      address: req.body.address?.trim() || null 
    });
    
    req.flash('success', 'Account created. You can now log in.');
    return res.redirect('/login');
  } catch (error) { 
    return next(error); 
  }
};

// Updated login without Passport
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      req.flash('error', 'Email and password are required.');
      return res.redirect('/login');
    }
    
    // Find user by email
    const user = await User.findOne({ 
      where: { email: email.toLowerCase().trim() } 
    });
    
    // Check if user exists
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }
    
    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) return next(err);
      
      // Store user in session (excluding sensitive data)
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      
      // Redirect based on role
      return res.redirect(user.role === 'admin' ? '/admin' : '/dashboard');
    });
    
  } catch (error) {
    return next(error);
  }
};

// Updated logout without Passport
exports.logout = (req, res, next) => {
  // Clear session
  req.session.destroy((err) => {
    if (err) return next(err);
    res.redirect('/login');
  });
};