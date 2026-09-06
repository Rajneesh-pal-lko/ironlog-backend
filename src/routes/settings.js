import express from 'express';
import Settings from '../models/Settings.js';
import UserRoutine from '../models/UserRoutine.js';
import { protect } from '../middleware/auth.js';
import { EQUIPMENT_OPTIONS, MOVEMENT_TYPES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

async function getOrCreate(userId, key, defaults) {
  let doc = await Settings.findOne({ userId, key });
  if (!doc) {
    doc = await Settings.create({ userId, key, items: defaults });
  }
  return doc;
}

// ── EQUIPMENT ─────────────────────────────────────────────────────────

router.get('/equipment', async (req, res) => {
  try {
    const doc = await getOrCreate(req.user._id, 'equipment', EQUIPMENT_OPTIONS);
    res.json(doc.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/equipment', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const doc = await getOrCreate(req.user._id, 'equipment', EQUIPMENT_OPTIONS);
    if (doc.items.includes(name.trim())) return res.status(400).json({ error: 'Already exists' });
    doc.items.push(name.trim());
    doc.items.sort();
    await doc.save();
    res.json(doc.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/equipment/:name', async (req, res) => {
  try {
    const doc = await getOrCreate(req.user._id, 'equipment', EQUIPMENT_OPTIONS);
    doc.items = doc.items.filter(i => i !== req.params.name);
    await doc.save();
    res.json(doc.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── MOVEMENT TYPES ────────────────────────────────────────────────────

router.get('/movement-types', async (req, res) => {
  try {
    const doc = await getOrCreate(req.user._id, 'movementTypes', MOVEMENT_TYPES);
    res.json(doc.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/movement-types', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const doc = await getOrCreate(req.user._id, 'movementTypes', MOVEMENT_TYPES);
    if (doc.items.includes(name.trim())) return res.status(400).json({ error: 'Already exists' });
    doc.items.push(name.trim());
    doc.items.sort();
    await doc.save();
    res.json(doc.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/movement-types/:name', async (req, res) => {
  try {
    const doc = await getOrCreate(req.user._id, 'movementTypes', MOVEMENT_TYPES);
    doc.items = doc.items.filter(i => i !== req.params.name);
    await doc.save();
    res.json(doc.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── WEEKLY ROUTINE ────────────────────────────────────────────────────

// GET — get user's weekly routine (creates empty one if not exists)
router.get('/routine', async (req, res) => {
  try {
    let routine = await UserRoutine.findOne({ userId: req.user._id });
    if (!routine) {
      routine = await UserRoutine.create({ userId: req.user._id });
    }
    res.json(routine.days);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH — save user's weekly routine
router.patch('/routine', async (req, res) => {
  try {
    const routine = await UserRoutine.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { days: req.body } },
      { new: true, upsert: true }
    );
    res.json(routine.days);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
