import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import exerciseRoutes from './routes/exercises.js';
import settingsRoutes from './routes/settings.js';
import workoutRoutes from './routes/workouts.js';
import seedRoutes from './routes/seed.js';
import progressRoutes from './routes/progress.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'IronLog API running ✅', version: '1.0.0' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/progress', progressRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
