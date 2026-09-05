import express from 'express';
import Settings from '../models/Settings.js';
import { EQUIPMENT_OPTIONS, MOVEMENT_TYPES } from '../config/constants.js';

const router = express.Router();

// Helper: get or create a settings doc by key
async function getOrCreate(key, defaults) {
  let doc = await Settings.findOne({ key });
  if (!doc) {
    doc = await Settings.create({ key, items: defaults });
  }
  return doc;
}

// ── EQUIPMENT ─────────────────────────────────────────────────────────

// GET equipment list
router.get('/equipment', async (req, res) => {
  try {
    const doc = await getOrCreate('equipment', EQUIPMENT_OPTIONS);
    res.json(doc.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add equipment item
router.post('/equipment', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const doc = await getOrCreate('equipment', EQUIPMENT_OPTIONS);
    if (doc.items.includes(name.trim())) return res.status(400).json({ error: 'Already exists' });
    doc.items.push(name.trim());
    doc.items.sort();
    await doc.save();
    res.json(doc.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE equipment item
router.delete('/equipment/:name', async (req, res) => {
  try {
    const doc = await getOrCreate('equipment', EQUIPMENT_OPTIONS);
    doc.items = doc.items.filter(i => i !== req.params.name);
    await doc.save();
    res.json(doc.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── MOVEMENT TYPES ────────────────────────────────────────────────────

// GET movement types
router.get('/movement-types', async (req, res) => {
  try {
    const doc = await getOrCreate('movementTypes', MOVEMENT_TYPES);
    res.json(doc.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add movement type
router.post('/movement-types', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const doc = await getOrCreate('movementTypes', MOVEMENT_TYPES);
    if (doc.items.includes(name.trim())) return res.status(400).json({ error: 'Already exists' });
    doc.items.push(name.trim());
    doc.items.sort();
    await doc.save();
    res.json(doc.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE movement type
router.delete('/movement-types/:name', async (req, res) => {
  try {
    const doc = await getOrCreate('movementTypes', MOVEMENT_TYPES);
    doc.items = doc.items.filter(i => i !== req.params.name);
    await doc.save();
    res.json(doc.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
