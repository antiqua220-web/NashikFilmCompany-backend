import mongoose from 'mongoose';

const shootScheduleSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Schedule must be linked to a project'],
      index: true,
    },
    dayNumber: {
      type: Number,
      required: [true, 'Day number is required (e.g. Day 1)'],
      default: 1,
    },
    title: {
      type: String,
      required: [true, 'Schedule title is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Shoot date is required'],
      index: true,
    },
    callTime: {
      type: String,
      required: [true, 'Call time is required (e.g. 05:30 AM)'],
      trim: true,
    },
    firstShotTime: {
      type: String,
      default: '07:00 AM',
      trim: true,
    },
    estimatedWrapTime: {
      type: String,
      default: '06:30 PM',
      trim: true,
    },
    locationName: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    locationAddress: {
      type: String,
      default: '',
      trim: true,
    },
    googleMapsUrl: {
      type: String,
      default: '',
    },
    scenes: [
      {
        sceneNumber: { type: String, required: true },
        heading: { type: String, required: true }, // EXT. VINEYARD - SUNSET
        dayNight: { type: String, default: 'DAY', uppercase: true, trim: true },
        description: { type: String, default: '', trim: true },
        cast: { type: String, default: '', trim: true },
        pages: { type: String, default: '1/8', trim: true },
      },
    ],
    weatherNotes: {
      type: String,
      default: '',
    },
    cateringNotes: {
      type: String,
      default: '',
    },
    hospitalNearest: {
      type: String,
      default: '',
    },
    requiredCrew: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        specialCallTime: { type: String, default: '' },
        instructions: { type: String, default: '' },
      },
    ],
    status: {
      type: String,
      default: 'scheduled',
      trim: true,
      index: true,
    },
    directorNotes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ShootSchedule = mongoose.model('ShootSchedule', shootScheduleSchema);
