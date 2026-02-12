const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Project = require('../models/Project');
const Club = require('../models/Club');


// ==================================================
// GET ROOM MESSAGES (Project / Club / General - Protected)
// ==================================================
router.get('/:room', auth, async (req, res) => {
  try {
    const room = req.params.room;
    const userId = req.user.id;

    // ==================================================
    // GENERAL CHAT (Campus-wide)
    // ==================================================
    if (room === 'general') {

      const messages = await Message.find({ room })
        .populate('from', 'name role')
        .sort({ createdAt: 1 });

      return res.json(
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
    }

    // ==================================================
    // Room must follow format type:id
    // ==================================================
    if (!room || !room.includes(':')) {
      return res.status(403).json([]);
    }

    const [type, id] = room.split(':');

    if (!type || !id) {
      return res.status(403).json([]);
    }

    // ==================================================
    // PROJECT ROOM VALIDATION
    // ==================================================
    if (type === 'project') {

      const project = await Project.findById(id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const isFaculty =
        project.faculty.toString() === userId;

      const isStudentMember =
        project.members
          .map(memberId => memberId.toString())
          .includes(userId);

      // 🚫 Block non-team users
      if (!isFaculty && !isStudentMember) {
        return res.status(403).json([]);
      }
    }

    // ==================================================
    // CLUB ROOM VALIDATION (PRIVATE CLUB CHAT)
    // ==================================================
    else if (type === 'club') {

      const club = await Club.findById(id);
      if (!club) {
        return res.status(404).json({ message: 'Club not found' });
      }

      const isClubHead =
        club.clubHead.toString() === userId;

      const isFaculty =
        club.faculty.toString() === userId;

      const isApprovedMember =
        club.members
          .map(memberId => memberId.toString())
          .includes(userId);

      // 🚫 Block non-members / pending users
      if (!isClubHead && !isFaculty && !isApprovedMember) {
        return res.status(403).json([]);
      }
    }

    // ==================================================
    // INVALID ROOM TYPE
    // ==================================================
    else {
      return res.status(403).json([]);
    }

    // ==================================================
    // LOAD MESSAGES (Authorized Only)
    // ==================================================
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
