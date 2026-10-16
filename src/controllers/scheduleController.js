import { ShootSchedule } from '../models/ShootSchedule.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';

// @desc    Get all shoot schedules / call sheets
// @route   GET /api/schedules
export const getSchedules = async (req, res) => {
  try {
    const { projectId, upcoming, status, startDate, endDate } = req.query;
    const filter = {};

    if (req.user && req.user.role === 'boss') {
      const myProjects = await Project.find({ createdBy: req.user._id }).select('_id');
      const myProjectIds = myProjects.map((p) => p._id);

      if (myProjectIds.length === 0) {
        return res.status(200).json({ success: true, count: 0, schedules: [] });
      }

      if (projectId && projectId !== 'undefined' && projectId !== 'null' && projectId !== 'all') {
        const isMine = myProjectIds.some((id) => id.toString() === projectId.toString());
        if (!isMine) {
          return res.status(200).json({ success: true, count: 0, schedules: [] });
        }
        filter.project = projectId;
      } else {
        filter.project = { $in: myProjectIds };
      }
    } else if (projectId && projectId !== 'undefined' && projectId !== 'null' && projectId !== 'all') {
      filter.project = projectId;
    }

    if (status && status !== 'undefined' && status !== 'null' && status !== 'all') {
      filter.status = status;
    }

    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.date = { $gte: today };
    } else if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const schedules = await ShootSchedule.find(filter)
      .populate('project', 'title code status primaryLocation coverImage')
      .populate('requiredCrew.user', 'name email department designation avatar status phone')
      .populate('createdBy', 'name email')
      .sort({ date: 1, callTime: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      schedules,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single schedule / call sheet by ID
// @route   GET /api/schedules/:id
export const getScheduleById = async (req, res) => {
  try {
    const schedule = await ShootSchedule.findById(req.params.id)
      .populate('project', 'title code status primaryLocation coverImage budget clientOrStudio createdBy')
      .populate('requiredCrew.user', 'name email department designation avatar status phone bio emergencyContact')
      .populate('createdBy', 'name email role');

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Shoot schedule not found' });
    }

    if (req.user && req.user.role === 'boss') {
      const ownerId = schedule.project?.createdBy?._id?.toString() || schedule.project?.createdBy?.toString();
      if (ownerId && ownerId !== req.user._id.toString()) {
        return res.status(404).json({ success: false, message: 'Shoot schedule not found' });
      }
    }

    res.status(200).json({
      success: true,
      schedule,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new shoot schedule / call sheet (Boss only)
// @route   POST /api/schedules
export const createSchedule = async (req, res) => {
  try {
    const {
      project,
      dayNumber,
      title,
      date,
      callTime,
      firstShotTime,
      estimatedWrapTime,
      locationName,
      locationAddress,
      googleMapsUrl,
      scenes,
      weatherNotes,
      cateringNotes,
      hospitalNearest,
      requiredCrew,
      directorNotes,
      status,
    } = req.body;

    if (!project || !title || !date || !callTime || !locationName) {
      return res.status(400).json({
        success: false,
        message: 'Project, title, date, call time, and location are required.',
      });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: 'Referenced project does not exist' });
    }

    if (req.user && req.user.role === 'boss') {
      const ownerId = projectDoc.createdBy?._id?.toString() || projectDoc.createdBy?.toString();
      if (ownerId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only create call sheets for your own projects.' });
      }
    }

    // Determine day number automatically if not passed
    let shootDayNum = dayNumber;
    if (!shootDayNum) {
      const count = await ShootSchedule.countDocuments({ project });
      shootDayNum = count + 1;
    }

    const schedule = await ShootSchedule.create({
      project,
      dayNumber: shootDayNum,
      title,
      date: new Date(date),
      callTime,
      firstShotTime: firstShotTime || '07:00 AM',
      estimatedWrapTime: estimatedWrapTime || '06:30 PM',
      locationName,
      locationAddress: locationAddress || '',
      googleMapsUrl: googleMapsUrl || '',
      scenes: scenes || [],
      weatherNotes: weatherNotes || 'Clear skies, golden hour at 5:45 PM.',
      cateringNotes: cateringNotes || 'Breakfast at Call Time. Lunch at 1:00 PM.',
      hospitalNearest: hospitalNearest || 'Apollo Clinic, Gangapur Rd, Nashik',
      requiredCrew: requiredCrew || [],
      directorNotes: directorNotes || '',
      status: status || 'scheduled',
      createdBy: req.user._id,
    });

    await Activity.create({
      project: projectDoc._id,
      user: req.user._id,
      action: 'SCHEDULE_CREATED',
      title: `Call Sheet: Day ${shootDayNum} Scheduled`,
      details: `${schedule.title} at ${schedule.locationName} (${callTime})`,
    });

    const populated = await ShootSchedule.findById(schedule._id)
      .populate('project', 'title code status')
      .populate('requiredCrew.user', 'name email department designation avatar phone');

    res.status(201).json({
      success: true,
      schedule: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update shoot schedule (Boss only)
// @route   PUT /api/schedules/:id
export const updateSchedule = async (req, res) => {
  try {
    let schedule = await ShootSchedule.findById(req.params.id).populate('project');

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Shoot schedule not found' });
    }

    if (req.user && req.user.role === 'boss') {
      const ownerId = schedule.project?.createdBy?._id?.toString() || schedule.project?.createdBy?.toString();
      if (ownerId && ownerId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify call sheets of another boss.' });
      }
    }

    schedule = await ShootSchedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('project', 'title code status')
      .populate('requiredCrew.user', 'name email department designation avatar phone');

    await Activity.create({
      project: schedule.project._id || schedule.project,
      user: req.user._id,
      action: 'SCHEDULE_UPDATED',
      title: `Call Sheet Day ${schedule.dayNumber} Updated`,
      details: `Call time: ${schedule.callTime}, Location: ${schedule.locationName}`,
    });

    res.status(200).json({
      success: true,
      schedule,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete shoot schedule (Boss only)
// @route   DELETE /api/schedules/:id
export const deleteSchedule = async (req, res) => {
  try {
    const schedule = await ShootSchedule.findById(req.params.id).populate('project');

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Shoot schedule not found' });
    }

    if (req.user && req.user.role === 'boss') {
      const ownerId = schedule.project?.createdBy?._id?.toString() || schedule.project?.createdBy?.toString();
      if (ownerId && ownerId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You cannot delete call sheets of another boss.' });
      }
    }

    await schedule.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Shoot schedule deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
