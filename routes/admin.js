const express = require('express');
const auth = require('../middleware/auth');
const permit = require('../middleware/permit');
const User = require('../models/User');
const Notice = require('../models/Notice');
const Event = require('../models/Event');

const router = express.Router();

// Admin summary
router.get('/summary', auth, permit('admin'), async (req, res) => {
  const usersCount = await User.countDocuments();
  const noticesCount = await Notice.countDocuments();
  const eventsCount = await Event.countDocuments();
  res.json({ usersCount, noticesCount, eventsCount });
});

// remove user
router.delete('/users/:id', auth, permit('admin'), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
