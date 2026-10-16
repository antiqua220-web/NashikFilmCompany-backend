import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';

// @desc    Get all tasks
// @route   GET /api/tasks
export const getTasks = async (req, res) => {
  try {
    const { projectId, assignedTo, status, priority, category, myTasks } = req.query;
    const filter = {};

    if (req.user && req.user.role === 'boss') {
      const myProjects = await Project.find({ createdBy: req.user._id }).select('_id');
      const myProjectIds = myProjects.map((p) => p._id);

      if (myProjectIds.length === 0) {
        return res.status(200).json({ success: true, count: 0, tasks: [] });
      }

      if (projectId && projectId !== 'undefined' && projectId !== 'null' && projectId !== 'all') {
        const isMine = myProjectIds.some((id) => id.toString() === projectId.toString());
        if (!isMine) {
          return res.status(200).json({ success: true, count: 0, tasks: [] });
        }
        filter.project = projectId;
      } else {
        filter.project = { $in: myProjectIds };
      }
    } else {
      if (projectId && projectId !== 'undefined' && projectId !== 'null' && projectId !== 'all') {
        filter.project = projectId;
      }
    }

    if (status && status !== 'undefined' && status !== 'null' && status !== 'all') {
      filter.status = status;
    }
    if (priority && priority !== 'undefined' && priority !== 'null' && priority !== 'all') {
      filter.priority = priority;
    }
    if (category && category !== 'undefined' && category !== 'null' && category !== 'all') {
      filter.category = category;
    }

    // If an employee requests "myTasks" or if they are an employee without explicit filter:
    if (myTasks === 'true' || (req.user && req.user.role === 'employee' && !assignedTo && !projectId)) {
      filter.assignedTo = req.user._id;
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    const tasks = await Task.find(filter)
      .populate('project', 'title code status coverImage primaryLocation')
      .populate('assignedTo', 'name email department designation avatar status phone')
      .populate('assignedBy', 'name email')
      .populate('scheduleDay', 'dayNumber title date callTime locationName')
      .sort({ dueDate: 1, priority: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title code status primaryLocation clientOrStudio')
      .populate('assignedTo', 'name email department designation avatar status phone')
      .populate('assignedBy', 'name email role')
      .populate('scheduleDay', 'dayNumber title date callTime locationName')
      .populate('statusHistory.changedBy', 'name avatar role');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (req.user && req.user.role === 'boss') {
      const myProjects = await Project.find({ createdBy: req.user._id }).select('_id');
      const myProjectIds = myProjects.map((p) => p._id.toString());
      const taskProjectId = task.project?._id ? task.project._id.toString() : task.project?.toString();
      if (!myProjectIds.includes(taskProjectId)) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new task (Boss only)
// @route   POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const {
      project,
      title,
      description,
      category,
      assignedTo,
      priority,
      dueDate,
      scheduleDay,
      checklist,
    } = req.body;

    if (!project || !title || !assignedTo || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Project, title, assigned crew member, and due date are required',
      });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: 'Referenced project does not exist' });
    }

    if (req.user && req.user.role === 'boss') {
      const ownerId = projectDoc.createdBy?._id?.toString() || projectDoc.createdBy?.toString();
      if (ownerId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only assign tasks to your own projects.' });
      }
    }

    const task = await Task.create({
      project,
      title,
      description: description || '',
      category: category || 'General / Set Operations',
      assignedTo,
      assignedBy: req.user._id,
      priority: priority || 'medium',
      status: 'todo',
      dueDate: new Date(dueDate),
      scheduleDay: scheduleDay || null,
      checklist: checklist || [],
      statusHistory: [
        {
          status: 'todo',
          changedBy: req.user._id,
          changedAt: new Date(),
          note: 'Task assigned',
        },
      ],
    });

    await Activity.create({
      project,
      user: req.user._id,
      action: 'TASK_CREATED',
      title: `Task "${task.title}" Assigned`,
      details: `Priority: ${task.priority.toUpperCase()} | Due: ${new Date(dueDate).toLocaleDateString()}`,
    });

    const populated = await Task.findById(task._id)
      .populate('project', 'title code status')
      .populate('assignedTo', 'name email department designation avatar')
      .populate('assignedBy', 'name email');

    res.status(201).json({
      success: true,
      task: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task status (Employee or Boss)
// @route   PATCH /api/tasks/:id/status
export const updateTaskStatus = async (req, res) => {
  try {
    const { status, note, completionNotes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check if user is authorized to update this task
    const isBoss = req.user.role === 'boss';
    const isAssigned = task.assignedTo.toString() === req.user._id.toString();

    if (!isBoss && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You can only update the status of tasks assigned to you.',
      });
    }

    const prevStatus = task.status;
    task.status = status;
    if (completionNotes) task.completionNotes = completionNotes;

    task.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note || `Status changed from ${prevStatus} to ${status}`,
    });

    await task.save();

    await Activity.create({
      project: task.project,
      user: req.user._id,
      action: 'TASK_STATUS_CHANGED',
      title: `Task "${task.title}" -> ${status.toUpperCase()}`,
      details: note || `Updated by ${req.user.name}`,
    });

    const updated = await Task.findById(task._id)
      .populate('project', 'title code status')
      .populate('assignedTo', 'name email department designation avatar')
      .populate('assignedBy', 'name email')
      .populate('statusHistory.changedBy', 'name avatar role');

    res.status(200).json({
      success: true,
      task: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task general details (Boss can edit all, employee can toggle checklist)
// @route   PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isBoss = req.user.role === 'boss';
    const isAssigned = task.assignedTo.toString() === req.user._id.toString();

    if (!isBoss && !isAssigned) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this task' });
    }

    if (isBoss) {
      const projectDoc = await Project.findById(task.project);
      if (projectDoc) {
        const ownerId = projectDoc.createdBy?._id?.toString() || projectDoc.createdBy?.toString();
        if (ownerId !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify tasks of another boss.' });
        }
      }
    }

    // If employee, they can only update checklist or notes or status
    if (!isBoss) {
      if (req.body.checklist !== undefined) task.checklist = req.body.checklist;
      if (req.body.completionNotes !== undefined) task.completionNotes = req.body.completionNotes;
      if (req.body.status !== undefined && req.body.status !== task.status) {
        task.status = req.body.status;
        task.statusHistory.push({
          status: req.body.status,
          changedBy: req.user._id,
          changedAt: new Date(),
          note: req.body.note || 'Updated by employee',
        });
      }
      await task.save();
    } else {
      task = await Task.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
    }

    const updated = await Task.findById(task._id)
      .populate('project', 'title code status')
      .populate('assignedTo', 'name email department designation avatar')
      .populate('assignedBy', 'name email');

    res.status(200).json({
      success: true,
      task: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete task (Boss only)
// @route   DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (req.user && req.user.role === 'boss') {
      const projectDoc = await Project.findById(task.project);
      if (projectDoc) {
        const ownerId = projectDoc.createdBy?._id?.toString() || projectDoc.createdBy?.toString();
        if (ownerId !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: 'Forbidden: You cannot delete tasks of another boss.' });
        }
      }
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
