const express = require('express');
const { v4: uuid } = require('uuid');

const asyncHandler = require('../utils/asyncHandler');
const { readJson, writeJson } = require('../utils/fileStore');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ensureNonEmptyString, ensureNumber } = require('../utils/validators');
const { badRequest } = require('../utils/errors');

const router = express.Router();

const verifyProductVendor = async (productId, vendorId) => {
  const products = await readJson('products.json', []);
  const product = products.find((item) => item.id === productId);
  if (!product) {
    throw badRequest('Product does not exist');
  }
  if (product.vendorId !== vendorId) {
    throw badRequest('Product does not belong to vendor');
  }
  return product;
};

// POST /api/customizations - Creates a new customization request for the logged-in user.
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = ensureNonEmptyString(req.body.productId, 'Product');
    const vendorId = ensureNonEmptyString(req.body.vendorId, 'Vendor');
    const details = ensureNonEmptyString(req.body.details, 'Details');
    const budget = req.body.budget ? ensureNumber(req.body.budget, 'Budget', { min: 1 }) : null;

    await verifyProductVendor(productId, vendorId);

    const requests = await readJson('customizations.json', []);
    const newRequest = {
      id: uuid(),
      customerId: req.user.id,
      productId,
      vendorId,
      details,
      budget,
      createdAt: new Date().toISOString(),
      status: 'new',
    };
    requests.push(newRequest);
    await writeJson('customizations.json', requests);
    res.status(201).json({ message: 'Customization request submitted', request: newRequest });
  })
);

// GET /api/customizations/my - Lists customization requests submitted by the authenticated customer.
router.get(
  '/my',
  requireAuth,
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    const requests = await readJson('customizations.json', []);
    res.json(
      requests
        .filter((request) => request.customerId === req.user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
  })
);

module.exports = router;
