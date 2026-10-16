import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { ShootSchedule } from '../models/ShootSchedule.js';
import { Task } from '../models/Task.js';
import { Activity } from '../models/Activity.js';

// @desc    Get all projects (with filtering)
// @route   GET /api/projects
export const getProjects = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    const filter = {};

    if (status && status !== 'undefined' && status !== 'null' && status !== 'all') {
      filter.status = status;
    }
    if (type && type !== 'undefined' && type !== 'null' && type !== 'all') {
      filter.type = type;
    }
    if (search && search !== 'undefined' && search !== 'null' && search.trim()) {
      const cleanSearch = search.trim();
      filter.$or = [
        { title: { $regex: cleanSearch, $options: 'i' } },
        { code: { $regex: cleanSearch, $options: 'i' } },
        { primaryLocation: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    // Boss users only see their own projects; if they own none, they see empty list
    if (req.user && req.user.role === 'boss') {
      filter.createdBy = req.user._id;
    }

    const projects = await Project.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignedCrew.user', 'name email department designation avatar status phone')
      .sort({ updatedAt: -1 });

    // Enrich with shoot count & task counts
    const enriched = await Promise.all(
      projects.map(async (project) => {
        const shootCount = await ShootSchedule.countDocuments({ project: project._id });
        const taskTotal = await Task.countDocuments({ project: project._id });
        const taskCompleted = await Task.countDocuments({ project: project._id, status: 'completed' });
        const nextShoot = await ShootSchedule.findOne({ project: project._id, date: { $gte: new Date() } }).sort({ date: 1 });

        return {
          ...project.toObject(),
          stats: {
            shootDaysCount: shootCount,
            tasksTotal: taskTotal,
            tasksCompleted: taskCompleted,
            completionPercent: taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0,
            nextShootDate: nextShoot ? nextShoot.date : null,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      projects: enriched,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single project by ID with schedules and tasks
// @route   GET /api/projects/:id
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('assignedCrew.user', 'name email department designation avatar status phone');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Boss users can only access their own projects
    if (req.user && req.user.role === 'boss') {
      const ownerId = project.createdBy?._id?.toString() || project.createdBy?.toString();
      if (ownerId !== req.user._id.toString()) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
    }

    const schedules = await ShootSchedule.find({ project: project._id })
      .populate('requiredCrew.user', 'name email department avatar phone')
      .sort({ date: 1 });

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email department designation avatar')
      .populate('assignedBy', 'name email')
      .sort({ dueDate: 1 });

    const activities = await Activity.find({ project: project._id })
      .populate('user', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(20);

    const taskTotal = tasks.length;
    const taskCompleted = tasks.filter((t) => t.status === 'completed').length;

    res.status(200).json({
      success: true,
      project: {
        ...project.toObject(),
        schedules,
        tasks,
        activities,
        stats: {
          shootDaysCount: schedules.length,
          tasksTotal: taskTotal,
          tasksCompleted: taskCompleted,
          completionPercent: taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new project (Boss only)
// @route   POST /api/projects
export const createProject = async (req, res) => {
  try {
    const {
      title,
      code,
      type,
      synopsis,
      clientOrStudio,
      status,
      budget,
      spent,
      currency,
      primaryLocation,
      startDate,
      targetWrapDate,
      coverImage,
      assignedCrew,
      tags,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Project title is required' });
    }

    // Generate smart unique code if not provided
    let projectCode = (code && code.trim()) ? code.trim().toUpperCase() : '';
    if (!projectCode) {
      const cleanTitle = title.replace(/[^A-Za-z0-9\s]/g, '').trim();
      const words = cleanTitle.split(/\s+/).filter(Boolean);
      let initials = words.slice(0, 3).map((w) => w[0].toUpperCase()).join('');
      if (initials.length < 2) initials = cleanTitle.substring(0, 3).toUpperCase() || 'PRJ';
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      projectCode = `${initials}-${year}-${randomSuffix}`;
    }

    const project = await Project.create({
      title: title.trim(),
      code: projectCode,
      type: type ? type.trim() : 'Feature Film',
      synopsis: synopsis || '',
      clientOrStudio: clientOrStudio ? clientOrStudio.trim() : '',
      status: status || 'pre-production',
      budget: Number(budget) || 0,
      spent: Number(spent) || 0,
      currency: currency || 'INR',
      primaryLocation: primaryLocation || '',
      startDate: startDate || new Date(),
      targetWrapDate: targetWrapDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      coverImage: coverImage ? coverImage.trim() : '',
      assignedCrew: assignedCrew || [],
      createdBy: req.user._id,
      tags: tags || [],
    });

    await Activity.create({
      project: project._id,
      user: req.user._id,
      action: 'PROJECT_CREATED',
      title: `Project "${project.title}" created`,
      details: `Initialized as ${project.type} in phase ${project.status}`,
    });

    const populated = await Project.findById(project._id)
      .populate('createdBy', 'name email role')
      .populate('assignedCrew.user', 'name email department designation avatar status');

    res.status(201).json({
      success: true,
      project: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update project (Boss only)
// @route   PUT /api/projects/:id
export const updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (req.user && req.user.role === 'boss') {
      const ownerId = project.createdBy?._id?.toString() || project.createdBy?.toString();
      if (ownerId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify projects owned by another studio head.' });
      }
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('createdBy', 'name email role')
      .populate('assignedCrew.user', 'name email department designation avatar status');

    await Activity.create({
      project: project._id,
      user: req.user._id,
      action: 'PROJECT_UPDATED',
      title: `Project "${project.title}" updated`,
      details: `Status is now ${project.status}`,
    });

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete project (Boss only)
// @route   DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (req.user && req.user.role === 'boss') {
      const ownerId = project.createdBy?._id?.toString() || project.createdBy?.toString();
      if (ownerId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You cannot delete projects owned by another studio head.' });
      }
    }

    // Cascade delete associated schedules and tasks
    await ShootSchedule.deleteMany({ project: project._id });
    await Task.deleteMany({ project: project._id });
    await Activity.deleteMany({ project: project._id });
    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: `Project "${project.title}" and associated schedules and tasks deleted successfully.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
