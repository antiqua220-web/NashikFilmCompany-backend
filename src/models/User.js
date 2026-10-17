import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['boss', 'employee'],
      default: 'employee',
      index: true,
    },
    department: {
      type: String,
      default: 'Production & Logistics',
      trim: true,
    },
    designation: {
      type: String,
      default: 'Crew Member',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'available',
      trim: true,
    },
    bio: {
      type: String,
      default: '',
    },
    emergencyContact: {
      type: String,
      default: '',
    },
    currentSessionId: {
      type: String,
      default: null,
      index: true,
    },
    lastLoginDevice: {
      type: String,
      default: '',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return safe user object
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model('User', userSchema);
