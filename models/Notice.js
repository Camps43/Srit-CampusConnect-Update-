const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String },
  pinned: { type: Boolean, default: false },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByRole: { type: String },
  visibleTo: { type: String, enum: ['all','students','faculty','club'], default: 'all' },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notice', NoticeSchema);
