function ensureAuthenticated(req, res, next) {
  if (req.session.user) return next();
  return res.redirect('/login');
}

function ensureGuest(req, res, next) {
  if (!req.session.user) return next();
  return res.redirect(
    req.session.user.role === 'admin'
      ? '/admin'
      : '/dashboard'
  );
}

function ensureRole(role) {
  return (req, res, next) => {
    if (
      req.session.user &&
      req.session.user.role === role
    ) {
      return next();
    }

    return res.status(403).render('errors/403', {
      title: 'Access denied'
    });
  };
}

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  ensureRole
};