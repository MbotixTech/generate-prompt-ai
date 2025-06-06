const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['veo', 'image'],
      required: true
    },
    originalFields: {
      type: Object,
      required: true
    },
    translatedFields: {
      type: Object,
      required: true
    },
    aiResult: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries by user and date
promptSchema.index({ userId: 1, createdAt: -1 });

const Prompt = mongoose.model('Prompt', promptSchema);

module.exports = Prompt;
