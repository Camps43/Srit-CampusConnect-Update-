const express = require('express');
const auth = require('../middleware/auth');
const permit = require('../middleware/permit');
const User = require('../models/User');

const router = express.Router();

// get own profile
router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

// update own profile
router.put('/me', auth, async (req, res) => {
  const { name, department, year, avatarUrl } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { name, department, year, avatarUrl }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// admin only: list users
router.get('/', auth, permit('admin'), async (req, res) => {
  const users = await User.find().select('-password').limit(500);
  res.json(users);
});

// admin: change role
router.put('/:id/role', auth, permit('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['student','faculty','clubhead','admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  res.json(user);
});

module.exports = router;
