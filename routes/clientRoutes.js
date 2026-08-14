const router = require('express').Router();
const { body } = require('express-validator');
const client = require('../controllers/client.controller');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');

router.use(ensureAuthenticated, ensureRole('client'));
router.get('/dashboard', client.dashboard);
const requestValidation = [
  body('address').trim().notEmpty().withMessage('Enter the delivery or shopping location.'),
  body('itemName').custom((value) => Array.isArray(value) ? value.length <= 100 : Boolean(value)).withMessage('A maximum of 100 items is allowed.'),
];
router.get('/requests/new', client.newRequest);
router.post('/requests', requestValidation, client.createRequest);
router.get('/requests/:id/edit', client.editRequest);
router.patch('/requests/:id', requestValidation, client.updateDraft);
router.get('/requests/:id', client.showRequest);
router.post('/notifications/:id/read', client.markNotificationRead);

module.exports = router;
