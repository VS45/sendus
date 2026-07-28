

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
      return res.status(422).render('auth/register', { title: 'Create account', form: req.body, validationErrors: errors.array() });
    }
    const email = req.body.email.toLowerCase().trim();
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(422).render('auth/register', { title: 'Create account', form: req.body, validationErrors: [{ msg: 'An account with this email already exists.' }] });
    }
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    await User.create({ name: req.body.name.trim(), email, passwordHash, role: 'client', address: req.body.address?.trim() || null });
    req.flash('success', 'Account created. You can now log in.');
    return res.redirect('/login');
  } catch (error) { return next(error); }
};

exports.login = (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) return next(error);
    if (!user) {
      req.flash('error', info?.message || 'Login failed.');
      return res.redirect('/login');
    }
    req.logIn(user, (loginError) => {
      if (loginError) return next(loginError);
      return res.redirect(user.role === 'admin' ? '/admin' : '/dashboard');
    });
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);
    req.session.destroy(() => res.redirect('/login'));
  });
};
