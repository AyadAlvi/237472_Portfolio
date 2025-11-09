const express = require('express');

const asyncHandler = require('../utils/asyncHandler');
const { readJson } = require('../utils/fileStore');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notFound } = require('../utils/errors');

const router = express.Router();

const findVendor = (vendors, identifier) =>
  vendors.find((vendor) => vendor.id === identifier || vendor.storeSlug === identifier);

// GET /api/vendors - Lists all vendors with basic stats.
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const vendors = await readJson('vendors.json', []);
    const products = await readJson('products.json', []);
    const summary = vendors.map((vendor) => ({
      ...vendor,
      productCount: products.filter((product) => product.vendorId === vendor.id).length,
    }));
    res.json(summary);
  })
);

// GET /api/vendors/me - Returns the authenticated vendor's store profile.
router.get(
  '/me',
  requireAuth,
  requireRole('vendor'),
  asyncHandler(async (req, res) => {
    const vendors = await readJson('vendors.json', []);
    const vendor = vendors.find((item) => item.id === req.user.vendorId);
    if (!vendor) {
      throw notFound('Vendor profile not found');
    }
    res.json(vendor);
  })
);

// GET /api/vendors/:vendorId - Returns a single vendor and their products.
router.get(
  '/:vendorId',
  asyncHandler(async (req, res) => {
    const vendors = await readJson('vendors.json', []);
    const vendor = findVendor(vendors, req.params.vendorId);
    if (!vendor) {
      throw notFound('Vendor not found');
    }
    const products = await readJson('products.json', []);
    const vendorProducts = products.filter((product) => product.vendorId === vendor.id);
    res.json({ ...vendor, products: vendorProducts });
  })
);

// GET /api/vendors/:vendorId/products - Lists products for a vendor id or slug.
router.get(
  '/:vendorId/products',
  asyncHandler(async (req, res) => {
    const vendors = await readJson('vendors.json', []);
    const vendor = findVendor(vendors, req.params.vendorId);
    if (!vendor) {
      throw notFound('Vendor not found');
    }
    const products = await readJson('products.json', []);
    res.json(products.filter((product) => product.vendorId === vendor.id));
  })
);

module.exports = router;
