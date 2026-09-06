import express from 'express';
import WorkoutSession from '../models/WorkoutSession.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// POST — start a new workout session
router.post('/', async (req, res) => {
  try {
    const session = await WorkoutSession.create({
      userId: req.user._id,
      workoutTypes: req.body.workoutTypes || [],
      notes: req.body.notes || '',
      startTime: new Date(),
      status: 'in_progress',
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET — get all sessions for user (summary list)
router.get('/', async (req, res) => {
  try {
    const sessions = await WorkoutSession.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(50);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET — get single session
router.get('/:id', async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH — update session (notes, status, endTime, workoutTypes)
router.patch('/:id', async (req, res) => {
  try {
    const session = await WorkoutSession.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST — add exercise to session
router.post('/:id/exercises', async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    session.exercises.push({
      exerciseId:   req.body.exerciseId,
      exerciseName: req.body.exerciseName,
      muscleGroup:  req.body.muscleGroup  || '',
      unilateral:   req.body.unilateral   || false,
      isBodyweight: req.body.isBodyweight || false,
      isTimed:      req.body.isTimed      || false,
      order:        session.exercises.length,
      sets:         [],
    });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST — add a set to an exercise in a session
router.post('/:id/exercises/:exerciseId/sets', async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const ex = session.exercises.id(req.params.exerciseId);
    if (!ex) return res.status(404).json({ error: 'Exercise not found in session' });
    ex.sets.push({
      setNumber:   ex.sets.length + 1,
      weight:      req.body.weight      ?? 0,
      reps:        req.body.reps        ?? 0,
      duration:    req.body.duration    ?? 0,
      leftWeight:  req.body.leftWeight  ?? 0,
      leftReps:    req.body.leftReps    ?? 0,
      rightWeight: req.body.rightWeight ?? 0,
      rightReps:   req.body.rightReps   ?? 0,
      unit:        req.body.unit        || 'kg',
      restSeconds: req.body.restSeconds ?? 0,
    });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH — update set values (weight, reps, duration, etc.)
router.patch('/:id/exercises/:exerciseId/sets/:setId', async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const ex = session.exercises.id(req.params.exerciseId);
    if (!ex) return res.status(404).json({ error: 'Exercise not found' });
    const set = ex.sets.id(req.params.setId);
    if (!set) return res.status(404).json({ error: 'Set not found' });
    const allowed = ['weight','reps','duration','leftWeight','leftReps','rightWeight','rightReps','unit','restSeconds'];
    allowed.forEach(f => { if (req.body[f] !== undefined) set[f] = req.body[f]; });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE — remove a set from an exercise
router.delete('/:id/exercises/:exerciseId/sets/:setId', async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const ex = session.exercises.id(req.params.exerciseId);
    if (!ex) return res.status(404).json({ error: 'Exercise not found' });
    ex.sets = ex.sets.filter(s => s._id.toString() !== req.params.setId);
    // Renumber sets
    ex.sets.forEach((s, i) => s.setNumber = i + 1);
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET — get last 3 sessions for a specific exercise (for showing history while logging)
router.get('/history/:exerciseId', async (req, res) => {
  try {
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      'exercises.exerciseId': req.params.exerciseId,
      status: 'completed',
    })
    .sort({ date: -1 })
    .limit(3);

    const history = sessions.map(s => {
      const ex = s.exercises.find(e => e.exerciseId.toString() === req.params.exerciseId);
      return {
        date: s.date,
        sets: ex.sets,
      };
    });

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET — get full history for a specific exercise
router.get('/history/:exerciseId/all', async (req, res) => {
  try {
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      'exercises.exerciseId': req.params.exerciseId,
      status: 'completed',
    }).sort({ date: -1 });

    const history = sessions.map(s => {
      const ex = s.exercises.find(e => e.exerciseId.toString() === req.params.exerciseId);
      return { date: s.date, sets: ex.sets };
    });

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
