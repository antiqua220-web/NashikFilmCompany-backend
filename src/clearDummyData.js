import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Project } from './models/Project.js';
import { ShootSchedule } from './models/ShootSchedule.js';
import { Task } from './models/Task.js';
import { Activity } from './models/Activity.js';

dotenv.config();

const clearDummyData = async () => {
  try {
    console.log('[Clean] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Clean] Connected.');

    const seedEmails = [
      'boss@nashikfilm.com',
      'arjun.dop@nashikfilm.com',
      'priya.sound@nashikfilm.com',
      'rohit.art@nashikfilm.com',
      'neha.edit@nashikfilm.com',
      'kabir.ad@nashikfilm.com',
    ];

    // Find the dummy users
    const dummyUsers = await User.find({ email: { $in: seedEmails } });
    const dummyUserIds = dummyUsers.map((u) => u._id);

    console.log(`[Clean] Found ${dummyUserIds.length} dummy seed users.`);

    // Find dummy projects created by dummy users or with seed project codes
    const seedCodes = ['NFC-2026-GDV', 'NFC-2026-MNS', 'NFC-2026-VHR', 'NFC-2026-NVG', 'NFC-2026-22', 'NFC-2026-27'];
    const dummyProjects = await Project.find({
      $or: [
        { createdBy: { $in: dummyUserIds } },
        { code: { $in: seedCodes } },
      ],
    });
    const dummyProjectIds = dummyProjects.map((p) => p._id);

    console.log(`[Clean] Found ${dummyProjectIds.length} dummy seed projects.`);

    // Delete tasks associated with dummy projects or assigned to/by dummy users
    const delTasks = await Task.deleteMany({
      $or: [
        { project: { $in: dummyProjectIds } },
        { assignedTo: { $in: dummyUserIds } },
        { assignedBy: { $in: dummyUserIds } },
      ],
    });
    console.log(`[Clean] Deleted ${delTasks.deletedCount} dummy tasks.`);

    // Delete schedules associated with dummy projects
    const delSchedules = await ShootSchedule.deleteMany({
      $or: [
        { project: { $in: dummyProjectIds } },
        { createdBy: { $in: dummyUserIds } },
      ],
    });
    console.log(`[Clean] Deleted ${delSchedules.deletedCount} dummy shoot schedules.`);

    // Delete activities associated with dummy users or projects
    const delActivities = await Activity.deleteMany({
      $or: [
        { user: { $in: dummyUserIds } },
        { project: { $in: dummyProjectIds } },
      ],
    });
    console.log(`[Clean] Deleted ${delActivities.deletedCount} dummy activities.`);

    // Delete dummy projects
    const delProjects = await Project.deleteMany({ _id: { $in: dummyProjectIds } });
    console.log(`[Clean] Deleted ${delProjects.deletedCount} dummy projects.`);

    // Delete dummy users
    const delUsers = await User.deleteMany({ _id: { $in: dummyUserIds } });
    console.log(`[Clean] Deleted ${delUsers.deletedCount} dummy users.`);

    // Verify remaining real data
    const remainingUsers = await User.find({}, { name: 1, email: 1, role: 1 });
    const remainingProjects = await Project.find({}, { title: 1, code: 1 });

    console.log('\n[Clean] Database Cleaned Successfully!');
    console.log('[Clean] Remaining Real Users:', remainingUsers);
    console.log('[Clean] Remaining Real Projects:', remainingProjects);

    process.exit(0);
  } catch (error) {
    console.error('[Clean Error]:', error);
    process.exit(1);
  }
};

clearDummyData();
