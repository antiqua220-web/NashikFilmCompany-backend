import { Notice } from '../models/Notice.js';
import { Project } from '../models/Project.js';
import { Activity } from '../models/Activity.js';

// @desc    Get all active notices / broadcasts
// @route   GET /api/notices
export const getNotices = async (req, res) => {
  try {
    const { project, category, priority, activeOnly } = req.query;
    const filter = {};

    if (activeOnly !== 'false') {
      filter.active = true;
    }
    if (project && project !== 'all' && project !== 'undefined') {
      filter.$or = [{ project }, { project: null }];
    }
    if (category && category !== 'all' && category !== 'undefined') {
      filter.category = category;
    }
    if (priority && priority !== 'all' && priority !== 'undefined') {
      filter.priority = priority;
    }

    const notices = await Notice.find(filter)
      .populate('broadcastBy', 'name email role designation department avatar')
      .populate('project', 'title code')
      .sort({ priority: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notices.length,
      notices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch production notices',
    });
  }
};

// @desc    Broadcast a new notice or set alert
// @route   POST /api/notices
export const createNotice = async (req, res) => {
  try {
    const { title, message, category, priority, project } = req.body;

    let projectTitle = '';
    if (project) {
      const p = await Project.findById(project);
      if (p) projectTitle = p.title;
    }

    const notice = await Notice.create({
      title,
      message,
      category: category || 'General Announcement',
      priority: priority || 'normal',
      project: project || null,
      projectTitle,
      broadcastBy: req.user._id,
      broadcasterName: req.user.name,
      broadcasterRole: req.user.designation || req.user.role,
    });

    await Activity.create({
      user: req.user._id,
      project: project || null,
      action: 'BROADCAST_NOTICE',
      title: `[${(notice.priority || 'NORMAL').toUpperCase()}] ${notice.title}`,
      details: notice.message,
    });

    res.status(201).json({
      success: true,
      notice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to broadcast notice',
    });
  }
};

// @desc    Acknowledge a notice
// @route   PATCH /api/notices/:id/acknowledge
export const acknowledgeNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      });
    }

    const alreadyAck = notice.acknowledgedBy.some(
      (a) => a.user?.toString() === req.user._id.toString()
    );

    if (!alreadyAck) {
      notice.acknowledgedBy.push({
        user: req.user._id,
        acknowledgedAt: new Date(),
      });
      await notice.save();
    }

    res.status(200).json({
      success: true,
      notice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to acknowledge notice',
    });
  }
};

// @desc    Delete or dismiss notice
// @route   DELETE /api/notices/:id
export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notice dismissed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notice',
    });
  }
};
