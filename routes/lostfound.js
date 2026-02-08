const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const permit = require('../middleware/permit');
const LostFound = require('../models/LostFound');

const router = express.Router();

// ---------- Multer setup ----------
const uploadDir = process.env.UPLOAD_DIR || 'uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  },
});

const upload = multer({ storage });

// ---------- POST: Report lost/found ----------
router.post('/', auth, upload.array('attachments', 6), async (req, res) => {
  try {
    const { title, description, location, found } = req.body;

    const attachments = (req.files || []).map(
      (f) => `/uploads/${f.filename}`
    );

    const item = await LostFound.create({
      title,
      description,
      location,
      found: found === 'true' || found === true,
      reportedBy: req.user._id,
      attachments,
      approved: false, // admin approval required
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Failed to report item' });
  }
});

// ---------- GET: List items ----------
router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { approved: true };

    const items = await LostFound.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('reportedBy', 'name role');

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch items' });
  }
});

// ---------- POST: Approve ----------
router.post(
  '/:id/approve',
  auth,
  permit('faculty', 'clubhead', 'admin'),
  async (req, res) => {
    try {
      const lf = await LostFound.findById(req.params.id);
      if (!lf) return res.status(404).json({ message: 'Item not found' });

      lf.approved = true;
      await lf.save();

      res.json(lf);
    } catch (err) {
      res.status(500).json({ message: 'Approval failed' });
    }
  }
);

module.exports = router;
