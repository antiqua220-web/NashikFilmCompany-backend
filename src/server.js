import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Ensure all Mongoose schemas are registered
import './models/User.js';
import './models/Project.js';
import './models/ShootSchedule.js';
import './models/Task.js';
import './models/Activity.js';

dotenv.config();

const app = express();

// Database Connection
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(morgan('dev'));

// Health / Status Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    appName: 'ShootSync',
    studio: process.env.STUDIO_NAME || 'ShootSync Studio',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ShootSync Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Production Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎬 ShootSync API Server Running`);
  console.log(`🏢 Studio: ${process.env.STUDIO_NAME || 'ShootSync Studio'}`);
  console.log(`🌐 Port: ${PORT} | Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
