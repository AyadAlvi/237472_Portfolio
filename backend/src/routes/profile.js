const express = require('express');

const asyncHandler = require('../utils/asyncHandler');
const { readJson, writeJson } = require('../utils/fileStore');
const { requireAuth } = require('../middleware/auth');
const { ensureNonEmptyString } = require('../utils/validators');
const { notFound } = require('../utils/errors');

const router = express.Router();

const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  vendorId: user.vendorId || null,
});

// GET /api/profile/me - Returns the authenticated user's profile summary.
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const users = await readJson('users.json', []);
    const user = users.find((item) => item.id === req.user.id);
    if (!user) {
      throw notFound('User profile not found');
    }
    res.json(formatUser(user));
  })
);

// PUT /api/profile/me - Allows the authenticated user to update their display name.
router.put(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const users = await readJson('users.json', []);
    const idx = users.findIndex((item) => item.id === req.user.id);
    if (idx === -1) {
      throw notFound('User profile not found');
    }

    const name = ensureNonEmptyString(req.body.name, 'Name');
    users[idx] = {
      ...users[idx],
      name,
      updatedAt: new Date().toISOString(),
    };
    await writeJson('users.json', users);
    res.json(formatUser(users[idx]));
  })
);

module.exports = router;
