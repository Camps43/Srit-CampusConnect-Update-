const mongoose = require('mongoose');

const projectProgressSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  progressPercent: {
    type: Number,
    required: true,
  },

  updateText: String,

  // ✅ ADD THIS (IMPORTANT)
  media: [
    {
      type: String, // Cloudinary image/video URL
    },
  ],

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },

  facultyFeedback: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ProjectProgress', projectProgressSchema);
