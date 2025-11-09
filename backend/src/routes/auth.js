const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const asyncHandler = require('../utils/asyncHandler');
const { readJson, writeJson } = require('../utils/fileStore');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const { ensureEmail, ensureNonEmptyString } = require('../utils/validators');
const { badRequest, unauthorized } = require('../utils/errors');

const router = express.Router();
const ALLOWED_ROLES = ['customer', 'vendor'];

const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  vendorId: user.vendorId || null,
});

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      vendorId: user.vendorId || null,
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

const toSlug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'studio';

const buildVendorRecord = (userName) => {
  const slug = toSlug(userName || 'new-vendor');
  return {
    id: `vndr-${slug}-${uuid().slice(0, 5)}`,
    name: `${userName || 'New'} Studio`,
    location: 'Set your city',
    bio: 'This vendor just joined Craft Collective and will update their story soon.',
    heroImage: '/images/vendors/placeholder.jpg',
    categories: ['Custom'],
    rating: 0,
    shippingPolicy: 'Ships after coordinating with the customer.',
    storeSlug: slug,
    social: {},
  };
};

// Registers a new customer or vendor account.
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const name = ensureNonEmptyString(req.body.name, 'Name');
    const email = ensureEmail(req.body.email);
    const password = ensureNonEmptyString(req.body.password, 'Password');
    if (password.length < 8) {
      throw badRequest('Password must be at least 8 characters long');
    }

    const users = await readJson('users.json', []);
    const existing = users.find((user) => user.email === email);
    if (existing) {
      throw badRequest('Email is already registered');
    }

    const role = ALLOWED_ROLES.includes(req.body.role) ? req.body.role : 'customer';
    let vendorId = null;
    if (role === 'vendor') {
      const providedId = (req.body.vendorId || req.body.storeId || '').trim();
      const vendors = await readJson('vendors.json', []);
      const existingVendor = providedId ? vendors.find((vendor) => vendor.id === providedId) : null;
      if (existingVendor) {
        vendorId = existingVendor.id;
      } else {
        const newVendor = buildVendorRecord(name);
        vendorId = newVendor.id;
        vendors.push(newVendor);
        await writeJson('vendors.json', vendors);
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuid(),
      name,
      email,
      role,
      vendorId,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    await writeJson('users.json', users);

    const token = signToken(newUser);
    res.status(201).json({
      token,
      user: formatUser(newUser),
    });
  })
);

// Logs an existing user in and returns a JWT.
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = ensureEmail(req.body.email);
    const password = ensureNonEmptyString(req.body.password, 'Password');

    const users = await readJson('users.json', []);
    const user = users.find((item) => item.email === email);
    if (!user) {
      throw unauthorized('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw unauthorized('Invalid credentials');
    }

    const token = signToken(user);
    res.json({
      token,
      user: formatUser(user),
    });
  })
);

// Returns the authenticated user's profile.
router.get(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const users = await readJson('users.json', []);
    const user = users.find((item) => item.id === req.user.id);
    if (!user) {
      throw unauthorized('User not found');
    }
    res.json(formatUser(user));
  })
);

module.exports = router;
