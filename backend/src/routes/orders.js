const express = require('express');

const asyncHandler = require('../utils/asyncHandler');
const { readJson } = require('../utils/fileStore');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders/my - Lists orders placed by the authenticated customer.
router.get(
  '/my',
  requireAuth,
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    const orders = await readJson('orders.json', []);
    const myOrders = orders
      .filter((order) => order.customerId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(myOrders);
  })
);

module.exports = router;
