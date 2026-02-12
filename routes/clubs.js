const express = require('express');
const auth = require('../middleware/auth');
const Club = require('../models/Club');
const User = require('../models/User');

const router = express.Router();

/* =====================================
   CREATE CLUB (ADMIN ONLY)
===================================== */
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { name, description, clubHead, faculty } = req.body;

    if (!name || !clubHead || !faculty) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const headUser = await User.findById(clubHead);
    const facultyUser = await User.findById(faculty);

    if (!headUser || headUser.role !== 'student') {
      return res.status(400).json({ message: 'Club head must be student' });
    }

    if (!facultyUser || facultyUser.role !== 'faculty') {
      return res.status(400).json({ message: 'Faculty must be faculty role' });
    }

    const club = await Club.create({
      name,
      description,
      clubHead,
      faculty,
      members: [clubHead],
      joinRequests: []
    });

    res.status(201).json(club);

  } catch (err) {
    console.error("CREATE CLUB ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


/* =====================================
   GET ALL CLUBS
===================================== */
router.get('/', auth, async (req, res) => {
  try {
    const clubs = await Club.find()
      .populate('clubHead', 'name email role')
      .populate('faculty', 'name email role')
      .populate('members', 'name email role');

    res.json(clubs);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


/* =====================================
   GET SINGLE CLUB
===================================== */
router.get('/:id', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('clubHead', 'name email role')
      .populate('faculty', 'name email role')
      .populate('members', 'name email role')
      .populate('joinRequests.user', 'name email role');

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    res.json(club);

  } catch (err) {
    console.error("GET CLUB ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


/* =====================================
   STUDENT JOIN REQUEST
===================================== */
router.post('/:id/join', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Students only' });
    }

    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Safe check: already member
    const isMember = club.members.some(
      m => m.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: 'Already a member' });
    }

    // Safe check: already requested
    const alreadyRequested = club.joinRequests.some(
      r => r.user.toString() === req.user._id.toString()
    );

    if (alreadyRequested) {
      return res.status(400).json({ message: 'Already requested' });
    }

    club.joinRequests.push({
      user: req.user._id,
      status: 'pending'
    });

    await club.save();

    res.json({ message: 'Join request sent' });

  } catch (err) {
    console.error("JOIN ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


/* =====================================
   APPROVE REQUEST
===================================== */
router.put('/:clubId/approve/:userId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    const isAuthorized =
      req.user._id.toString() === club.clubHead.toString() ||
      req.user._id.toString() === club.faculty.toString();

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const request = club.joinRequests.find(
      r => r.user.toString() === req.params.userId
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Add member safely
    const isAlreadyMember = club.members.some(
      m => m.toString() === req.params.userId
    );

    if (!isAlreadyMember) {
      club.members.push(req.params.userId);
    }

    // Remove from requests
    club.joinRequests = club.joinRequests.filter(
      r => r.user.toString() !== req.params.userId
    );

    await club.save();

    res.json({ message: 'Member approved' });

  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


/* =====================================
   REJECT REQUEST
===================================== */
router.put('/:clubId/reject/:userId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    const isAuthorized =
      req.user._id.toString() === club.clubHead.toString() ||
      req.user._id.toString() === club.faculty.toString();

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    club.joinRequests = club.joinRequests.filter(
      r => r.user.toString() !== req.params.userId
    );

    await club.save();

    res.json({ message: 'Request rejected' });

  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
