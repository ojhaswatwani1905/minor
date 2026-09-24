import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import hazardRoutes from './routes/hazardRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { startDeadManSwitchWorker } from './services/deadManSwitchService.js';
import { importAndMergeOpenData } from './scripts/importOpenData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/hazards', hazardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'STSMS Wilderness Safety Engine & Dead Man Switch Active' });
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`STSMS Backend Emergency Server running on port ${PORT} (0.0.0.0 LAN active)`);
  console.log(`JSON Database active: server/json/`);
  
  // Seed Open Data (OSM POIs & Data.gov.in blackspots)
  try {
    importAndMergeOpenData();
  } catch (e) {
    console.error('Open data seed check complete:', e.message);
  }

  // Start Dead Man's Switch Cloud Automated Dispatcher Loop
  startDeadManSwitchWorker();

  console.log(`====================================================`);
});
