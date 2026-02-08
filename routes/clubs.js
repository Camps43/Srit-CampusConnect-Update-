const express = require('express');
const slugify = require('slugify');
const auth = require('../middleware/auth');
const permit = require('../middleware/permit');
const Club = require('../models/Club');
const User = require('../models/User');

const router = express.Router();

// create club (admin or faculty)
router.post('/', auth, permit('admin','faculty'), async (req, res) => {
  const { name, description } = req.body;
  const slug = slugify(name, { lower: true, strict: true });
  const exist = await Club.findOne({ slug });
  if (exist) return res.status(400).json({ message: 'Club exists' });
  const club = new Club({ name, slug, description, admins: [req.user._id] });
  await club.save();
  res.json(club);
});

// join club
router.post('/:id/join', auth, async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ message: 'Club not found' });
  if (!club.members.includes(req.user._id)) club.members.push(req.user._id);
  if (!club.admins.includes(req.user._id) && req.body.makeAdmin) club.admins.push(req.user._id);
  await club.save();
  if (!req.user.clubs.includes(club._id)) {
    req.user.clubs.push(club._id);
    await req.user.save();
  }
  res.json(club);
});

// list clubs
router.get('/', auth, async (req, res) => {
  const clubs = await Club.find().limit(200);
  res.json(clubs);
});

// get club
router.get('/:id', auth, async (req, res) => {
  const club = await Club.findById(req.params.id).populate('members','name email').populate('admins','name email');
  res.json(club);
});

module.exports = router;
