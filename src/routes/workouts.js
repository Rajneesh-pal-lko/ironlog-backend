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

// DELETE — remove an exercise from a session
router.delete('/:id/exercises/:exerciseId', async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const before = session.exercises.length;
    session.exercises = session.exercises.filter(
      ex => ex._id.toString() !== req.params.exerciseId
    );
    if (session.exercises.length === before) return res.status(404).json({ error: 'Exercise not found in session' });
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

// GET — get the most recent completed session for a given weekday (0=Sun, 1=Mon, ... 6=Sat)
router.get('/last-by-weekday/:weekday', async (req, res) => {
  try {
    const weekday = parseInt(req.params.weekday);
    if (isNaN(weekday) || weekday < 0 || weekday > 6) {
      return res.status(400).json({ error: 'Invalid weekday (0-6)' });
    }

    // Fetch recent completed sessions and filter by weekday in JS
    // (MongoDB $dayOfWeek is 1=Sun..7=Sat, so we filter in JS for clarity)
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      status: 'completed',
    }).sort({ date: -1 }).limit(100);

    const match = sessions.find(s => new Date(s.date).getDay() === weekday);

    if (!match) return res.json(null);

    res.json({
      _id:          match._id,
      date:         match.date,
      workoutTypes: match.workoutTypes,
      exercises:    match.exercises.map(ex => ({
        _id:          ex._id,
        exerciseId:   ex.exerciseId,
        exerciseName: ex.exerciseName,
        muscleGroup:  ex.muscleGroup,
        isBodyweight: ex.isBodyweight,
        isTimed:      ex.isTimed,
        unilateral:   ex.unilateral,
        sets:         ex.sets,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// GET — best set ever for an exercise (for PR detection)
router.get('/pr/:exerciseId', async (req, res) => {
  try {
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      'exercises.exerciseId': req.params.exerciseId,
      status: 'completed',
    }).sort({ date: -1 });

    let best = { weight: 0, reps: 0, volume: 0 };
    for (const s of sessions) {
      const ex = s.exercises.find(e => e.exerciseId?.toString() === req.params.exerciseId);
      if (!ex) continue;
      for (const set of (ex.sets || [])) {
        const vol = (set.weight || 0) * (set.reps || 1);
        if (vol > best.volume) best = { weight: set.weight || 0, reps: set.reps || 0, volume: vol };
      }
    }
    res.json(best);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET — recent unique exercises (last 20 sessions, deduplicated, with last-done date)
router.get('/recent-exercises', async (req, res) => {
  try {
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      status: 'completed',
    }).sort({ date: -1 }).limit(20);

    const seen = new Map(); // exerciseId → { exerciseId, exerciseName, muscleGroup, isBodyweight, isTimed, unilateral, lastDate, bestSet }
    for (const s of sessions) {
      for (const ex of s.exercises) {
        const id = ex.exerciseId?.toString();
        if (!id || seen.has(id)) continue;
        // Find best set (highest weight×reps volume)
        const bestSet = (ex.sets || []).reduce((best, s) => {
          const vol = (s.weight || 0) * (s.reps || 1);
          return vol > ((best?.weight || 0) * (best?.reps || 1)) ? s : best;
        }, null);
        seen.set(id, {
          exerciseId:   id,
          exerciseName: ex.exerciseName,
          muscleGroup:  ex.muscleGroup,
          isBodyweight: ex.isBodyweight,
          isTimed:      ex.isTimed,
          unilateral:   ex.unilateral,
          lastDate:     s.date,
          lastSets:     ex.sets || [],
          bestSet,
        });
      }
    }
    res.json([...seen.values()]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
