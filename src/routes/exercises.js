import express from 'express';
import Exercise from '../models/Exercise.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes protected — user must be logged in
router.use(protect);

// GET all exercises for logged in user
router.get('/', async (req, res) => {
  try {
    const exercises = await Exercise.find({ userId: req.user._id }).sort({ name: 1 });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create exercise
router.post('/', async (req, res) => {
  try {
    const exercise = new Exercise({ ...req.body, userId: req.user._id });
    const saved = await exercise.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update exercise
router.put('/:id', async (req, res) => {
  try {
    const updated = await Exercise.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Exercise not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH toggle active
router.patch('/:id/toggle', async (req, res) => {
  try {
    const exercise = await Exercise.findOne({ _id: req.params.id, userId: req.user._id });
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
    exercise.active = !exercise.active;
    await exercise.save();
    res.json(exercise);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE exercise
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Exercise.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ error: 'Exercise not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
