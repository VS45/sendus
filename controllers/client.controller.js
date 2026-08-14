const { validationResult } = require('express-validator');
const { sequelize, PurchaseRequest, RequestItem, AuditLog, Notification } = require('../models');
const { resolveLocation } = require('../services/geocodingService');
const { calculateCharge, money } = require('../services/chargeService');

exports.dashboard = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const where = { clientId: req.user.id };
    if (status && ['draft', 'pending', 'approved', 'purchased', 'fulfilled', 'rejected'].includes(status)) where.status = status;

    const [{ count, rows }, notifications] = await Promise.all([
      PurchaseRequest.findAndCountAll({
        where, include: [{ model: RequestItem, as: 'items' }], order: [['createdAt', 'DESC']], limit, offset, distinct: true,
      }),
      Notification.findAll({ where: { userId: req.user.id, readAt: null }, order: [['createdAt', 'DESC']], limit: 5 }),
    ]);
    res.render('client/dashboard', { title: 'My requests', requests: rows, notifications, status, page, totalPages: Math.ceil(count / limit) });
  } catch (error) { next(error); }
};

exports.newRequest = (req, res) => res.render('client/new', {
  title: 'New purchase request',
  heading: 'New purchase request',
  formAction: '/requests',
  form: { address: req.user.address || '', items: [{ name: '', targetPrice: '' }] },
  pricing: {
    baseFee: Number(process.env.BASE_FEE || 2), distanceRate: Number(process.env.DISTANCE_RATE || 0.5), itemRate: Number(process.env.ITEM_RATE || 0.5),
  },
});

exports.createRequest = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const errors = validationResult(req);
    const names = Array.isArray(req.body.itemName) ? req.body.itemName : [req.body.itemName];
    const prices = Array.isArray(req.body.targetPrice) ? req.body.targetPrice : [req.body.targetPrice];
    const items = names.map((name, index) => ({ name: String(name || '').trim(), targetPrice: Number(prices[index]) })).filter((item) => item.name);

    if (!errors.isEmpty() || items.length === 0 || items.some((item) => !Number.isFinite(item.targetPrice) || item.targetPrice < 0)) {
      await transaction.rollback();
      return res.status(422).render('client/new', {
        title: 'New purchase request', heading: 'New purchase request', formAction: '/requests', form: { ...req.body, items }, validationErrors: [...errors.array(), ...(items.length ? [] : [{ msg: 'Add at least one valid item.' }])],
        pricing: { baseFee: Number(process.env.BASE_FEE || 2), distanceRate: Number(process.env.DISTANCE_RATE || 0.5), itemRate: Number(process.env.ITEM_RATE || 0.5) },
      });
    }

    const location = await resolveLocation(req.body);
    const charge = calculateCharge(location.distanceKm, items.length);
    const itemsTotal = money(items.reduce((sum, item) => sum + item.targetPrice, 0));
    const status = req.body.action === 'draft' ? 'draft' : 'pending';
    const request = await PurchaseRequest.create({
      clientId: req.user.id,
      locationAddress: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      distanceKm: location.distanceKm,
      serviceCharge: charge.total,
      itemsTotal,
      status,
    }, { transaction });

    await RequestItem.bulkCreate(items.map((item) => ({ ...item, requestId: request.id })), { transaction });
    await AuditLog.create({ requestId: request.id, action: status === 'draft' ? 'saved_as_draft' : 'submitted', fromStatus: null, toStatus: status, metadata: { charge } }, { transaction });
    await transaction.commit();
    req.flash('success', status === 'draft' ? 'Draft saved.' : 'Your purchase request was submitted for review.');
    res.redirect(`/requests/${request.id}`);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    req.flash('error', error.message);
    res.redirect('/requests/new');
  }
};

exports.showRequest = async (req, res, next) => {
  try {
    const request = await PurchaseRequest.findOne({
      where: { id: req.params.id, clientId: req.user.id },
      include: [
        { model: RequestItem, as: 'items' },
        { model: AuditLog, as: 'auditLogs', order: [['createdAt', 'DESC']] },
      ],
    });
    if (!request) return res.status(404).render('errors/404', { title: 'Request not found' });
    res.render('client/show', { title: `Request #${request.id}`, request });
  } catch (error) { next(error); }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (notification && !notification.readAt) { notification.readAt = new Date(); await notification.save(); }
    res.redirect(req.get('referer') || '/dashboard');
  } catch (error) { next(error); }
};


exports.editRequest = async (req, res, next) => {
  try {
    const request = await PurchaseRequest.findOne({
      where: { id: req.params.id, clientId: req.user.id, status: 'draft' },
      include: [{ model: RequestItem, as: 'items' }],
    });
    if (!request) return res.status(404).render('errors/404', { title: 'Draft not found' });
    res.render('client/new', {
      title: `Edit draft #${request.id}`,
      heading: `Edit draft #${request.id}`,
      formAction: `/requests/${request.id}?_method=PATCH`,
      form: {
        address: request.locationAddress,
        latitude: request.latitude,
        longitude: request.longitude,
        items: request.items.map((item) => ({ name: item.name, targetPrice: item.targetPrice })),
      },
      pricing: {
        baseFee: Number(process.env.BASE_FEE || 2),
        distanceRate: Number(process.env.DISTANCE_RATE || 0.5),
        itemRate: Number(process.env.ITEM_RATE || 0.5),
      },
    });
  } catch (error) { next(error); }
};

exports.updateDraft = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const request = await PurchaseRequest.findOne({
      where: { id: req.params.id, clientId: req.user.id, status: 'draft' }, transaction, lock: transaction.LOCK.UPDATE,
    });
    if (!request) {
      await transaction.rollback();
      return res.status(404).render('errors/404', { title: 'Draft not found' });
    }

    const errors = validationResult(req);
    const names = Array.isArray(req.body.itemName) ? req.body.itemName : [req.body.itemName];
    const prices = Array.isArray(req.body.targetPrice) ? req.body.targetPrice : [req.body.targetPrice];
    const items = names.map((name, index) => ({ name: String(name || '').trim(), targetPrice: Number(prices[index]) })).filter((item) => item.name);
    if (!errors.isEmpty() || items.length === 0 || items.some((item) => !Number.isFinite(item.targetPrice) || item.targetPrice < 0)) {
      await transaction.rollback();
      return res.status(422).render('client/new', {
        title: `Edit draft #${request.id}`, heading: `Edit draft #${request.id}`, formAction: `/requests/${request.id}?_method=PATCH`,
        form: { ...req.body, items }, validationErrors: [...errors.array(), ...(items.length ? [] : [{ msg: 'Add at least one valid item.' }])],
        pricing: { baseFee: Number(process.env.BASE_FEE || 2), distanceRate: Number(process.env.DISTANCE_RATE || 0.5), itemRate: Number(process.env.ITEM_RATE || 0.5) },
      });
    }

    const location = await resolveLocation(req.body);
    const charge = calculateCharge(location.distanceKm, items.length);
    const nextStatus = req.body.action === 'submit' ? 'pending' : 'draft';
    request.locationAddress = location.address;
    request.latitude = location.latitude;
    request.longitude = location.longitude;
    request.distanceKm = location.distanceKm;
    request.serviceCharge = charge.total;
    request.itemsTotal = money(items.reduce((sum, item) => sum + item.targetPrice, 0));
    request.status = nextStatus;
    await request.save({ transaction });
    await RequestItem.destroy({ where: { requestId: request.id }, transaction });
    await RequestItem.bulkCreate(items.map((item) => ({ ...item, requestId: request.id })), { transaction });
    await AuditLog.create({
      requestId: request.id,
      action: nextStatus === 'pending' ? 'submitted' : 'draft_updated',
      fromStatus: 'draft',
      toStatus: nextStatus,
      metadata: { charge },
    }, { transaction });
    await transaction.commit();
    req.flash('success', nextStatus === 'pending' ? 'Draft submitted for review.' : 'Draft updated.');
    res.redirect(`/requests/${request.id}`);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    req.flash('error', error.message);
    res.redirect(`/requests/${req.params.id}/edit`);
  }
};
