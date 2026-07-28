module.exports = function locals(req, res, next) {
  res.locals.currentUser = req.user || null;
  console.log('Current User:', res.locals.currentUser);
  res.locals.messages = {
    success: req.flash('success'),
    error: req.flash('error'),
  };
  res.locals.currency = process.env.CURRENCY || 'USD';
  res.locals.companyName = process.env.COMPANY_NAME || 'Send-Us';
  res.locals.formatMoney = (value) => new Intl.NumberFormat('en', {
    style: 'currency', currency: process.env.CURRENCY || 'USD', minimumFractionDigits: 2,
  }).format(Number(value || 0));
  res.locals.formatDate = (value) => value ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
  next();
};
