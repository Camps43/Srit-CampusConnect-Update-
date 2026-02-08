const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: String,

  text: String,

  meta: {
    type: Object,
    default: {}
  },

  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);
