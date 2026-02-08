const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Project = require('../models/Project');


// GET PROJECT DISCUSSION MESSAGES (TEAM-ONLY)

router.get('/:room', auth, async (req, res) => {
  try {
    const room = req.params.room;

    // Only allow project rooms
    if (!room.startsWith('project:')) {
      return res.status(403).json([]);
    }

    const projectId = room.split(':')[1];

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userId = req.user.id;

    const isFaculty =
      project.faculty.toString() === userId;

    const isStudentMember =
      project.members.map(id => id.toString()).includes(userId);

    // 🚫 Block non-team users
    if (!isFaculty && !isStudentMember) {
      return res.status(403).json([]);
    }

    // ✅ Load messages for allowed users
    const messages = await Message.find({ room })
      .populate('from', 'name role')
      .sort({ createdAt: 1 });

    res.json(
      messages.map(m => ({
        _id: m._id,
        room: m.room,
        text: m.text,
        meta: m.meta,
        from: m.from
          ? {
              _id: m.from._id,
              name: m.from.name,
              role: m.from.role,
            }
          : null,
        createdAt: m.createdAt,
      }))
    );
  } catch (err) {
    console.error('Load messages error:', err);
    res.status(500).json({ message: 'Failed to load messages' });
  }
});

module.exports = router;
