const express = require('express');

const asyncHandler = require('../utils/asyncHandler');
const { readJson } = require('../utils/fileStore');
const { notFound } = require('../utils/errors');

const router = express.Router();

// GET /api/products - Supports filtering by vendorId and fuzzy search.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { vendorId, search } = req.query;
    let products = await readJson('products.json', []);

    if (vendorId) {
      products = products.filter((product) => product.vendorId === vendorId);
    }

    if (search) {
      const lower = search.toLowerCase();
      products = products.filter(
        (product) =>
          product.name.toLowerCase().includes(lower) ||
          product.description.toLowerCase().includes(lower) ||
          product.tags.some((tag) => tag.toLowerCase().includes(lower))
      );
    }

    res.json(products);
  })
);

// GET /api/products/:productId - Fetches a single product by id.
router.get(
  '/:productId',
  asyncHandler(async (req, res) => {
    const products = await readJson('products.json', []);
    const product = products.find((item) => item.id === req.params.productId);
    if (!product) {
      throw notFound('Product not found');
    }
    res.json(product);
  })
);

module.exports = router;
