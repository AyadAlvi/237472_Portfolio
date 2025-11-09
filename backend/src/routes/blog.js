const express = require('express');

const asyncHandler = require('../utils/asyncHandler');
const { readJson } = require('../utils/fileStore');
const { notFound } = require('../utils/errors');

const router = express.Router();

// GET /api/blog - Returns the list of blog entries.
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const posts = await readJson('blog.json', []);
    res.json(posts);
  })
);

// GET /api/blog/:postId - Returns a single blog entry.
router.get(
  '/:postId',
  asyncHandler(async (req, res) => {
    const posts = await readJson('blog.json', []);
    const post = posts.find((item) => item.id === req.params.postId);
    if (!post) {
      throw notFound('Post not found');
    }
    res.json(post);
  })
);

module.exports = router;
