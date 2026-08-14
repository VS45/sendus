const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const User = require('./models/User');
const flash = require('connect-flash');
const clientRoutes = require('./routes/clientRoutes');
// In app.js
const locals = require('./middleware/locals');

// Add this after your session middleware

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(flash());
app.use(locals);
// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// After setting up csrf middleware
app.use((req, res, next) => {
  // Pass csrfToken to all views
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null;
  res.locals.form = {}; // Empty form for all views
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/requests', clientRoutes);
// Dashboard (protected route)
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  try {
    const user = await User.findByPk(req.session.user.id);
    res.render('dashboard', {
      user: user,
      title: 'Dashboard'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Protected route middleware
app.use((req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Sync database and start server
sequelize.sync({ force: false })
  .then(() => {
    console.log('Database synced successfully');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Unable to sync database:', error);
  });