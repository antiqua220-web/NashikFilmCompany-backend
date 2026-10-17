import mongoose from 'mongoose';

const gearIncidentSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporterName: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: ['Minor', 'Major', 'Critical'],
      default: 'Minor',
    },
    issue: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: 'On Set',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Reported', 'Under Inspection', 'Resolved'],
      default: 'Reported',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const gearItemSchema = new mongoose.Schema(
  {
    tagId: {
      type: String,
      required: [true, 'Gear tag ID is required (e.g. CAM-A-01)'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Gear item name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Camera', 'Optics', 'Sound', 'Lighting', 'Monitoring', 'Rigging', 'Grip', 'Power', 'Drone', 'Accessories'],
      default: 'Camera',
      index: true,
    },
    serialNo: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Checked Out', 'In Locker', 'Maintenance', 'On Set'],
      default: 'In Locker',
      index: true,
    },
    condition: {
      type: String,
      enum: ['Mint', 'Good', 'Fair', 'Needs Inspection'],
      default: 'Good',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    addedByName: {
      type: String,
      default: '',
    },
    addedByRole: {
      type: String,
      enum: ['boss', 'employee', ''],
      default: '',
    },
    assignedDate: {
      type: Date,
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    incidents: [gearIncidentSchema],
    activeIssue: {
      type: String,
      default: '',
    },
    specs: {
      type: String,
      default: '',
    },
    purchaseDate: {
      type: Date,
    },
    estimatedValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const GearItem = mongoose.model('GearItem', gearItemSchema);
