import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notice message is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Call Sheet Update', 'Weather Warning', 'Set Safety', 'General Announcement', 'Wrap Time', 'Urgent SOS', 'Equipment Alert'],
      default: 'General Announcement',
      index: true,
    },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'normal'],
      default: 'normal',
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    projectTitle: {
      type: String,
      default: '',
    },
    broadcastBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    broadcasterName: {
      type: String,
      default: 'Production Control',
    },
    broadcasterRole: {
      type: String,
      default: 'Producer',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    acknowledgedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        acknowledgedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h default
    },
  },
  {
    timestamps: true,
  }
);

export const Notice = mongoose.model('Notice', noticeSchema);
