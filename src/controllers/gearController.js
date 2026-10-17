import { GearItem } from '../models/GearItem.js';
import { Activity } from '../models/Activity.js';

// @desc    Get all gear items
// @route   GET /api/gear
export const getGearItems = async (req, res) => {
  try {
    const { category, status, assignedTo, project, search, myGear } = req.query;
    const filter = {};

    if (category && category !== 'all' && category !== 'undefined') {
      filter.category = category;
    }
    if (status && status !== 'all' && status !== 'undefined') {
      filter.status = status;
    }
    if (project && project !== 'all' && project !== 'undefined') {
      filter.project = project;
    }
    if (myGear === 'true' && req.user) {
      filter.assignedTo = req.user._id;
    } else if (assignedTo && assignedTo !== 'all' && assignedTo !== 'undefined') {
      filter.assignedTo = assignedTo;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { tagId: { $regex: q, $options: 'i' } },
        { serialNo: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
      ];
    }

    const items = await GearItem.find(filter)
      .populate('assignedTo', 'name email designation department avatar phone status')
      .populate('addedBy', 'name email designation department role')
      .populate('project', 'title code')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      gear: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch gear items',
    });
  }
};

// @desc    Get single gear item
// @route   GET /api/gear/:id
export const getGearItemById = async (req, res) => {
  try {
    const item = await GearItem.findById(req.params.id)
      .populate('assignedTo', 'name email designation department avatar phone')
      .populate('addedBy', 'name email designation department role')
      .populate('project', 'title code')
      .populate('incidents.reportedBy', 'name email designation avatar');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found',
      });
    }

    res.status(200).json({
      success: true,
      gear: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch gear item',
    });
  }
};

// @desc    Create new gear item
// @route   POST /api/gear
export const createGearItem = async (req, res) => {
  try {
    const gearData = {
      ...req.body,
      addedBy: req.user?._id || req.body.addedBy,
      addedByName: req.user?.name || req.body.addedByName || 'Production',
      addedByRole: req.user?.role || req.body.addedByRole || 'boss',
    };
    if (req.user && req.user.role === 'employee' && !gearData.assignedTo) {
      gearData.assignedTo = req.user._id;
    }
    const item = await GearItem.create(gearData);

    if (req.user?._id) {
      try {
        await Activity.create({
          user: req.user._id,
          action: 'ADDED_GEAR_ITEM',
          title: `Registered gear "${item.name}" (${item.tagId})`,
          details: `Category: ${item.category} | Serial: ${item.serialNo || 'N/A'}`,
        });
      } catch (actErr) {
        console.warn('Activity log error:', actErr.message);
      }
    }

    res.status(201).json({
      success: true,
      gear: item,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create gear item',
    });
  }
};

// @desc    Update gear item
// @route   PUT /api/gear/:id
export const updateGearItem = async (req, res) => {
  try {
    const item = await GearItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedTo', 'name email designation department avatar phone');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found',
      });
    }

    res.status(200).json({
      success: true,
      gear: item,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update gear item',
    });
  }
};

// @desc    Update gear status (Checkout / Checkin / Set)
// @route   PATCH /api/gear/:id/status
export const updateGearStatus = async (req, res) => {
  try {
    const { status, notes, assignedTo, batteryLevel } = req.body;
    const item = await GearItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found',
      });
    }

    item.status = status || item.status;
    if (notes !== undefined) item.notes = notes;
    if (batteryLevel !== undefined) item.batteryLevel = batteryLevel;

    if (status === 'Checked Out') {
      item.assignedTo = assignedTo || req.user._id;
      item.assignedDate = new Date();
    } else if (status === 'In Locker') {
      item.assignedTo = null;
      item.assignedDate = null;
    } else if (status === 'On Set' && !item.assignedTo) {
      item.assignedTo = req.user._id;
    }

    await item.save();

    await Activity.create({
      user: req.user._id,
      action: 'UPDATED_GEAR_STATUS',
      title: `Gear "${item.name}" marked as ${item.status}`,
      details: notes || `Tag: ${item.tagId}`,
    });

    const populated = await GearItem.findById(item._id)
      .populate('assignedTo', 'name email designation department avatar phone');

    res.status(200).json({
      success: true,
      gear: populated,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update gear status',
    });
  }
};

// @desc    Add incident report to gear item
// @route   POST /api/gear/:id/incidents
export const addGearIncident = async (req, res) => {
  try {
    const { severity, issue, location } = req.body;
    const item = await GearItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found',
      });
    }

    const incident = {
      reportedBy: req.user._id,
      reporterName: req.user.name,
      severity: severity || 'Minor',
      issue: issue || 'Unspecified issue',
      location: location || 'On Set',
      status: 'Reported',
      timestamp: new Date(),
    };

    item.incidents.push(incident);
    item.activeIssue = issue;
    if (severity === 'Critical') {
      item.status = 'Maintenance';
      item.condition = 'Needs Inspection';
    }

    await item.save();

    await Activity.create({
      user: req.user._id,
      action: 'REPORTED_GEAR_INCIDENT',
      title: `[${severity}] Incident reported on "${item.name}"`,
      details: `${issue} at ${location || 'On Set'}`,
    });

    res.status(201).json({
      success: true,
      gear: item,
      incident,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to report incident',
    });
  }
};

// @desc    Delete gear item
// @route   DELETE /api/gear/:id
export const deleteGearItem = async (req, res) => {
  try {
    const item = await GearItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Gear item ${item.tagId} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete gear item',
    });
  }
};
