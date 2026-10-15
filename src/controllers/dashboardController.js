import { Project } from '../models/Project.js';
import { ShootSchedule } from '../models/ShootSchedule.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';

// @desc    Get boss dashboard analytics & metrics
// @route   GET /api/dashboard/boss
export const getBossDashboard = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    // Count active projects as all projects not explicitly wrapped or archived
    const activeProjects = await Project.countDocuments({
      status: { $nin: ['archived', 'wrapped'] },
    });
    const inProductionProjects = await Project.countDocuments({ status: 'production' });

    // Financial calculations & all projects enriched with metrics
    const allProjects = await Project.find()
      .populate('createdBy', 'name email role')
      .populate('assignedCrew.user', 'name email department designation avatar status phone')
      .sort({ updatedAt: -1 });

    const totalBudget = allProjects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const totalSpent = allProjects.reduce((acc, p) => acc + (p.spent || 0), 0);

    const enrichedProjects = await Promise.all(
      allProjects.map(async (project) => {
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

    // Crew statistics
    const totalCrew = await User.countDocuments({ role: 'employee' });
    const onSetCrew = await User.countDocuments({ status: 'on-set' });

    // Task breakdown
    const taskStats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const taskMap = { todo: 0, in_progress: 0, review: 0, completed: 0, blocked: 0 };
    taskStats.forEach((t) => {
      taskMap[t._id] = t.count;
    });

    const urgentTasks = await Task.find({ priority: 'urgent', status: { $ne: 'completed' } })
      .populate('project', 'title code')
      .populate('assignedTo', 'name department avatar')
      .limit(5);

    // Upcoming shoot days (next 14 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingShoots = await ShootSchedule.find({ date: { $gte: today } })
      .populate('project', 'title code')
      .sort({ date: 1 })
      .limit(6);

    // Recent activities
    const recentActivities = await Activity.find()
      .populate('user', 'name avatar role')
      .populate('project', 'title code')
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        activeProjects: activeProjects || totalProjects,
        inProductionProjects,
        projects: enrichedProjects,
        financials: {
          totalBudget,
          totalSpent,
          budgetBurnRate: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        },
        crew: {
          totalCrew,
          onSetCrew,
        },
        tasks: {
          total: Object.values(taskMap).reduce((a, b) => a + b, 0),
          breakdown: taskMap,
        },
        urgentTasks,
        upcomingShoots,
        recentActivities,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get employee personalized dashboard
// @route   GET /api/dashboard/employee
export const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Next scheduled shoot that includes this crew member or from active projects
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextShoot = await ShootSchedule.findOne({
      date: { $gte: today },
      $or: [
        { 'requiredCrew.user': userId },
        { status: 'scheduled' },
      ],
    })
      .populate('project', 'title code primaryLocation coverImage')
      .sort({ date: 1 });

    // My tasks
    const myTasks = await Task.find({ assignedTo: userId })
      .populate('project', 'title code')
      .sort({ dueDate: 1 });

    const pendingTasks = myTasks.filter((t) => t.status !== 'completed');
    const urgentTasks = myTasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed');
    const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress');
    const completedTasks = myTasks.filter((t) => t.status === 'completed');

    // Recent notifications / activity
    const recentActivities = await Activity.find()
      .populate('user', 'name avatar')
      .populate('project', 'title code')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        user: req.user.toSafeObject(),
        nextShoot,
        tasksSummary: {
          totalAssigned: myTasks.length,
          pending: pendingTasks.length,
          urgent: urgentTasks.length,
          inProgress: inProgressTasks.length,
          completed: completedTasks.length,
        },
        urgentTasks,
        pendingTasks: pendingTasks.slice(0, 8),
        recentActivities,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
