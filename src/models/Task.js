import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'General / Set Operations',
      trim: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must be assigned to an employee'],
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      default: 'medium',
      trim: true,
      index: true,
    },
    status: {
      type: String,
      default: 'todo',
      trim: true,
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    scheduleDay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShootSchedule',
    },
    checklist: [
      {
        text: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    completionNotes: {
      type: String,
      default: '',
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Task = mongoose.model('Task', taskSchema);
