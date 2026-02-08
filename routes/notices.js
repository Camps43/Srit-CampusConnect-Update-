const express = require('express');
const auth = require('../middleware/auth');
const permit = require('../middleware/permit');
const Notice = require('../models/Notice');

const router = express.Router();

// POST: create notice (faculty, clubhead, admin)
router.post('/', auth, permit('faculty','clubhead','admin'), async (req, res) => {
  try {
    const { title, body, visibleTo, club } = req.body;
    const notice = new Notice({
      title, body, visibleTo, club,
      author: req.user._id, createdByRole: req.user.role
    });
    await notice.save();

    // emit via socket.io
    const io = req.app.get('io');
    if (io) {
      // emit to all, and also to role rooms if needed
      io.emit('notice:new', { id: notice._id, title: notice.title, visibleTo, createdByRole: notice.createdByRole });
      if (notice.visibleTo === 'students') io.to('role:student').emit('notice:new', notice);
    }

    res.json(notice);
  } catch (err) {
    console.error('create notice err', err);
    res.status(500).json({ message: 'Failed to create notice' });
  }
});

// GET: list notices, *filtered by role*
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    const role = req.user.role;
    if (role === 'student') {
      // students only see notices created by faculty or clubhead, or visibleTo = all/students
      filter = {
        $or: [
          { createdByRole: { $in: ['faculty','clubhead'] } },
          { visibleTo: { $in: ['all','students'] } }
        ]
      };
    } else if (role === 'clubhead') {
      // clubhead sees club notices and faculty notices and their own
      filter = {
        $or: [
          { createdByRole: { $in: ['faculty','clubhead'] } },
          { author: req.user._id },
          { visibleTo: 'all' }
        ]
      };
    } else if (role === 'faculty') {
      // faculty can see faculty + their own + all
      filter = {
        $or: [
          { createdByRole: { $in: ['faculty','clubhead'] } },
          { author: req.user._id },
          { visibleTo: 'all' }
        ]
      };
    } else if (role === 'admin') {
      filter = {}; // admin sees all
    }

    const notices = await Notice.find(filter).sort({ pinned: -1, createdAt: -1 }).limit(500).populate('author','name role');
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notices' });
  }
});

// GET single
router.get('/:id', auth, async (req, res) => {
  const n = await Notice.findById(req.params.id).populate('author','name role');
  res.json(n);
});

// delete (faculty/clubhead/admin) — but only author or admin
router.delete('/:id', auth, async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ message: 'Not found' });
  if (req.user.role !== 'admin' && notice.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not allowed' });
  }
  await notice.remove();
  res.json({ ok: true });
});

module.exports = router;
