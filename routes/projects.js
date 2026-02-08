const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const Project = require('../models/Project');
const ProjectProgress = require('../models/ProjectProgress');
const User = require('../models/User');
const upload = require('../middleware/cloudinaryUpload');

   //CREATE PROJECT (Faculty only)

router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can create projects' });
    }

    const { title, description, members } = req.body;

    if (!title || !Array.isArray(members)) {
      return res.status(400).json({ message: 'Title and members are required' });
    }

    const existing = await Project.find({ members: { $in: members } });
    if (existing.length > 0) {
      return res.status(400).json({
        message: 'Some selected students already belong to another project',
      });
    }

    const project = await Project.create({
      title,
      description,
      faculty: req.user._id,
      members,
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


   //GET PROJECTS (Role-based)

router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query = { members: req.user._id };
    } else if (req.user.role === 'faculty') {
      query = { faculty: req.user._id };
    }

    const projects = await Project.find(query)
      .populate('faculty', 'name email')
      .populate('members', 'name email');

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

  // GET ALL STUDENTS (Faculty)

router.get('/students', auth, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const students = await User.find({ role: 'student' })
      .select('name email _id');

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


   //STUDENT SUBMITS PROGRESS

router.post('/:id/progress', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        message: 'Only students can submit progress',
      });
    }

    const { progressPercent, updateText } = req.body;

    const progress = await ProjectProgress.create({
      project: req.params.id,
      student: req.user._id,
      progressPercent,
      updateText,
      status: 'pending',
    });

    res.status(201).json(progress);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


  // UPLOAD PROGRESS MEDIA (Image / Video)

router.post(
  '/progress/:progressId/media',
  auth,
  upload.array('media', 5),
  async (req, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students allowed' });
      }

      const mediaUrls = req.files.map(file => file.path);

      const progress = await ProjectProgress.findByIdAndUpdate(
        req.params.progressId,
        { $push: { media: { $each: mediaUrls } } },
        { new: true }
      );

      res.json(progress);
    } catch (err) {
      res.status(500).json({ message: 'Upload failed' });
    }
  }
);


   //FACULTY APPROVES / REJECTS PROGRESS

router.put('/progress/:progressId/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        message: 'Only faculty can approve or reject progress',
      });
    }

    const { status, feedback } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const progress = await ProjectProgress.findByIdAndUpdate(
      req.params.progressId,
      { status, facultyFeedback: feedback },
      { new: true }
    ).populate('student', 'name email');

    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


   //GET PROJECT PROGRESS

router.get('/:id/progress', auth, async (req, res) => {
  try {
    const progress = await ProjectProgress.find({
      project: req.params.id,
    })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


   //DISCUSSION MEDIA UPLOAD (Image / Video)

router.post(
  '/discussion/upload',
  auth,
  upload.single('file'),
  async (req, res) => {
    try {
      res.json({
        url: req.file.path, // Cloudinary URL
      });
    } catch (err) {
      res.status(500).json({ message: 'Upload failed' });
    }
  }
);

module.exports = router;
