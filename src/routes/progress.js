import express from 'express';
import WorkoutSession from '../models/WorkoutSession.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET /api/progress/exercises-done
// Returns distinct exercises the user has ever logged (from completed sessions)
router.get('/exercises-done', async (req, res) => {
  try {
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      status: 'completed',
    }).select('exercises.exerciseId exercises.exerciseName exercises.muscleGroup');

    const map = {};
    for (const s of sessions) {
      for (const ex of s.exercises) {
        const id = ex.exerciseId?.toString();
        if (id && !map[id]) {
          map[id] = { _id: ex.exerciseId, name: ex.exerciseName, muscleGroup: ex.muscleGroup };
        }
      }
    }
    res.json(Object.values(map).sort((a, b) => a.name.localeCompare(b.name)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/progress/by-date?date=2026-09-06
// Returns the full workout session for a given date
router.get('/by-date', async (req, res) => {
  try {
    const { date } = req.query;
    const d = date ? new Date(date) : new Date();
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end   = new Date(d); end.setHours(23, 59, 59, 999);
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end },
      status: 'completed',
    }).sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/progress/by-exercise/:exerciseId?limit=10
// Returns all completed sessions containing this exercise, with sets
router.get('/by-exercise/:exerciseId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0; // 0 = all
    let query = WorkoutSession.find({
      userId: req.user._id,
      'exercises.exerciseId': req.params.exerciseId,
      status: 'completed',
    }).sort({ date: -1 });
    if (limit > 0) query = query.limit(limit);
    const sessions = await query;
    const history = sessions.map(s => {
      const ex = s.exercises.find(e => e.exerciseId.toString() === req.params.exerciseId);
      return {
        _id: s._id,
        date: s.date,
        workoutTypes: s.workoutTypes,
        sets: ex?.sets || [],
        totalVolume: (ex?.sets || []).reduce((acc, set) => acc + (set.weight || 0) * (set.reps || 1), 0),
        bestSet: (ex?.sets || []).reduce((best, set) => {
          const val = (set.weight || 0) * (set.reps || 1);
          return val > (best?.val || 0) ? { weight: set.weight, reps: set.reps, unit: set.unit, val } : best;
        }, null),
      };
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/progress/by-muscle/:muscleGroup
// Returns all sessions that included exercises from a muscle group
router.get('/by-muscle/:muscleGroup', async (req, res) => {
  try {
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      'exercises.muscleGroup': req.params.muscleGroup,
      status: 'completed',
    }).sort({ date: -1 }).limit(50);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/progress/calendar?months=3
// Returns dates that have completed sessions (for calendar view)
router.get('/calendar', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 3;
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      status: 'completed',
      date: { $gte: since },
    }).select('date workoutTypes exercises').sort({ date: -1 });
    const days = sessions.map(s => ({
      date: s.date.toISOString().split('T')[0],
      workoutTypes: s.workoutTypes,
      exerciseCount: s.exercises.length,
      setCount: s.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0),
    }));
    res.json(days);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
