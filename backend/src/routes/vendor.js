const express = require('express');
const { v4: uuid } = require('uuid');

const asyncHandler = require('../utils/asyncHandler');
const { readJson, writeJson } = require('../utils/fileStore');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ensureNonEmptyString, ensureNumber } = require('../utils/validators');
const { badRequest, notFound } = require('../utils/errors');

const router = express.Router();

const ensureVendorContext = (user) => {
  if (!user.vendorId) {
    throw badRequest('No vendor store linked to this account');
  }
};

// GET /api/vendor/products - Lists products owned by the authenticated vendor.
router.get(
  '/products',
  requireAuth,
  requireRole('vendor'),
  asyncHandler(async (req, res) => {
    ensureVendorContext(req.user);
    const products = await readJson('products.json', []);
    res.json(products.filter((product) => product.vendorId === req.user.vendorId));
  })
);

// POST /api/vendor/products - Creates a new product for the vendor.
router.post(
  '/products',
  requireAuth,
  requireRole('vendor'),
  asyncHandler(async (req, res) => {
    ensureVendorContext(req.user);
    const name = ensureNonEmptyString(req.body.name, 'Name');
    const description = ensureNonEmptyString(req.body.description, 'Description');
    const price = ensureNumber(req.body.price, 'Price', { min: 1 });

    const products = await readJson('products.json', []);
    const newProduct = {
      id: `prd-${uuid()}`,
      vendorId: req.user.vendorId,
      name,
      description,
      price,
      inventory: Number.isInteger(req.body.inventory) ? req.body.inventory : 0,
      images: Array.isArray(req.body.images) ? req.body.images : [],
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      customizations: Array.isArray(req.body.customizations) ? req.body.customizations : [],
      isActive: req.body.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.push(newProduct);
    await writeJson('products.json', products);
    res.status(201).json(newProduct);
  })
);

// PUT /api/vendor/products/:productId - Updates a vendor product (price, inventory, status, etc.).
router.put(
  '/products/:productId',
  requireAuth,
  requireRole('vendor'),
  asyncHandler(async (req, res) => {
    ensureVendorContext(req.user);
    const products = await readJson('products.json', []);
    const idx = products.findIndex((product) => product.id === req.params.productId && product.vendorId === req.user.vendorId);
    if (idx === -1) {
      throw notFound('Product not found');
    }

    const next = { ...products[idx] };
    if (req.body.name) next.name = ensureNonEmptyString(req.body.name, 'Name');
    if (req.body.description) next.description = ensureNonEmptyString(req.body.description, 'Description');
    if (req.body.price !== undefined) next.price = ensureNumber(req.body.price, 'Price', { min: 1 });
    if (req.body.inventory !== undefined) next.inventory = ensureNumber(req.body.inventory, 'Inventory', { min: 0 });
    if (req.body.isActive !== undefined) next.isActive = Boolean(req.body.isActive);
    next.updatedAt = new Date().toISOString();

    products[idx] = next;
    await writeJson('products.json', products);
    res.json(next);
  })
);

// GET /api/vendor/customizations - Fetches customization requests for the vendor.
router.get(
  '/customizations',
  requireAuth,
  requireRole('vendor'),
  asyncHandler(async (req, res) => {
    ensureVendorContext(req.user);
    const requests = await readJson('customizations.json', []);
    res.json(requests.filter((request) => request.vendorId === req.user.vendorId));
  })
);

module.exports = router;
