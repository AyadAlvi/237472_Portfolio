const express = require('express');
const { v4: uuid } = require('uuid');

const asyncHandler = require('../utils/asyncHandler');
const { readJson, writeJson } = require('../utils/fileStore');
const { requireAuth } = require('../middleware/auth');
const { ensureNumber } = require('../utils/validators');
const { badRequest } = require('../utils/errors');

const MAX_ITEMS = 20;
const router = express.Router();

// POST /api/cart/checkout - Validates the cart, rebuilds totals, and stores an order record.
router.post(
  '/checkout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { items, paymentMethod = 'card', notes = '' } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw badRequest('At least one item is required');
    }
    if (items.length > MAX_ITEMS) {
      throw badRequest('Cart exceeds maximum length');
    }

    const products = await readJson('products.json', []);
    const orders = await readJson('orders.json', []);

    const orderItems = items.map((item, index) => {
      const product = products.find((prd) => prd.id === item.productId);
      if (!product) {
        throw badRequest(`Product ${item.productId} was not found`);
      }
      const quantity = ensureNumber(item.quantity, `Item ${index + 1} quantity`, { min: 1, max: 10 });
      const customizationPayload =
        item.customizations && typeof item.customizations === 'object' ? item.customizations : {};
      const lineTotal = Number((product.price * quantity).toFixed(2));
      return {
        productId: product.id,
        name: product.name,
        vendorId: product.vendorId,
        price: product.price,
        quantity,
        customizations: customizationPayload,
        lineTotal,
      };
    });

    const subtotal = Number(orderItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
    const serviceFee = Number((subtotal * 0.05).toFixed(2));
    const total = Number((subtotal + serviceFee).toFixed(2));

    const newOrder = {
      id: uuid(),
      customerId: req.user.id,
      customerName: req.user.name,
      createdAt: new Date().toISOString(),
      paymentMethod,
      subtotal,
      serviceFee,
      total,
      notes: typeof notes === 'string' ? notes.slice(0, 280) : '',
      items: orderItems,
      status: 'processing',
    };

    orders.push(newOrder);
    await writeJson('orders.json', orders);

    res.status(201).json({ message: 'Checkout complete', order: newOrder });
  })
);

module.exports = router;
