const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // general | project:<id> | club:<id>
    room: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    // Message type
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },

    // Message content
    text: {
      type: String,
      trim: true,
      default: '',
    },

    // Reply reference 
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    // Metadata (attachments etc.)
    meta: {
      type: Object,
      default: {},
    },

    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    edited: {
      type: Boolean,
      default: false,
    },

    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Faster room queries
messageSchema.index({ room: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
