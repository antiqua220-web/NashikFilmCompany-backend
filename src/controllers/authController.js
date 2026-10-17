import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const generateToken = (id, sessionId) => {
  return jwt.sign(
    { id, sessionId },
    process.env.JWT_SECRET || 'shootsync_nashik_secret_production_key_2026_supersecure',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, phone, bio, avatar, deviceId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'employee',
      department: department || 'Production & Logistics',
      designation: designation || (role === 'boss' ? 'Studio Head / Director' : 'Crew Member'),
      phone: phone || '',
      bio: bio || '',
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(name)}`,
      currentSessionId: sessionId,
      lastLoginDevice: req.headers['user-agent'] || deviceId || 'Mobile Device',
      lastLoginAt: new Date(),
    });

    const token = generateToken(user._id, sessionId);

    res.status(201).json({
      success: true,
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        errorCode: 'ACCOUNT_NOT_FOUND',
        message: `No studio account found with email "${cleanEmail}". Please check your email or join the production team.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid password for this studio account. Please check your credentials and try again.',
      });
    }

    // Single-device policy: Generate a unique session ID for this new login.
    // Any previous device holding an older token will be automatically invalidated.
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    user.currentSessionId = sessionId;
    user.lastLoginDevice = req.headers['user-agent'] || deviceId || 'Mobile Device';
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id, sessionId);

    res.status(200).json({
      success: true,
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user / terminate active device session
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    if (req.user) {
      req.user.currentSessionId = null;
      await req.user.save({ validateBeforeSave: false });
    }
    res.status(200).json({
      success: true,
      message: 'Active device session terminated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        errorCode: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found. The user account belonging to this session no longer exists.',
      });
    }
    res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, department, phone, bio, status, avatar, emergencyContact, designation } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name !== undefined && name.trim()) user.name = name.trim();
    if (department !== undefined) user.department = department.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio;
    if (status !== undefined) user.status = status;
    if (avatar !== undefined) user.avatar = avatar;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (designation !== undefined) user.designation = designation.trim();

    await user.save();

    res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all crew members (employees & bosses)
// @route   GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const { role, department } = req.query;
    const query = {};
    if (role && role !== 'undefined' && role !== 'null' && role !== 'all') {
      query.role = role;
    }
    if (department && department !== 'undefined' && department !== 'null' && department !== 'all') {
      query.department = department;
    }

    const users = await User.find(query).sort({ role: 1, name: 1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => u.toSafeObject()),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Boss adds new crew member
// @route   POST /api/users
export const createCrewMember = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, phone, bio, avatar } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || 'ShootSync2026!',
      role: role || 'employee',
      department: department || 'Production & Logistics',
      designation: designation || 'Crew Specialist',
      phone: phone || '',
      bio: bio || '',
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(name)}`,
    });

    res.status(201).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
