import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please provide a valid token.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shootsync_nashik_secret_production_key_2026_supersecure');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        errorCode: 'ACCOUNT_NOT_FOUND',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // Single-device policy check:
    // If the token contains a sessionId and the user has a currentSessionId in DB,
    // they must match. If another device logged in, currentSessionId will differ.
    if (decoded.sessionId && user.currentSessionId && user.currentSessionId !== decoded.sessionId) {
      return res.status(401).json({
        success: false,
        errorCode: 'SESSION_TERMINATED_MULTIPLE_DEVICES',
        message: 'Your account was logged in on another device. Only 1 active device session is permitted at a time.',
      });
    }

    // Adopt session if user had none set yet
    if (!user.currentSessionId && decoded.sessionId) {
      user.currentSessionId = decoded.sessionId;
      await user.save({ validateBeforeSave: false });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user?.role}' does not have permission for this action.`,
      });
    }
    next();
  };
};
