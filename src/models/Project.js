import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      default: 'Feature Film',
      trim: true,
    },
    synopsis: {
      type: String,
      default: '',
    },
    clientOrStudio: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      default: 'pre-production',
      trim: true,
      index: true,
    },
    budget: {
      type: Number,
      default: 0,
    },
    spent: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    primaryLocation: {
      type: String,
      default: '',
      trim: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    targetWrapDate: {
      type: Date,
    },
    coverImage: {
      type: String,
      default: '',
    },
    assignedCrew: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        roleTitle: {
          type: String,
          default: 'Crew Member',
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-generate unique production code if not provided
projectSchema.pre('validate', function (next) {
  if (!this.code && this.title) {
    const cleanTitle = this.title.replace(/[^A-Za-z0-9\s]/g, '').trim();
    const words = cleanTitle.split(/\s+/).filter(Boolean);
    let initials = words.slice(0, 3).map((w) => w[0].toUpperCase()).join('');
    if (initials.length < 2) {
      initials = cleanTitle.substring(0, 3).toUpperCase() || 'PRJ';
    }
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    this.code = `${initials}-${year}-${randomSuffix}`;
  }
  next();
});

// Virtual for shoot days count and task count
projectSchema.virtual('shootDays', {
  ref: 'ShootSchedule',
  localField: '_id',
  foreignField: 'project',
  count: true,
});

projectSchema.virtual('tasksCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true,
});

export const Project = mongoose.model('Project', projectSchema);
