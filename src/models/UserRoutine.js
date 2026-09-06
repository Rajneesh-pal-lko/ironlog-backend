import mongoose from 'mongoose';

// Each day stores a label ("Push Day", "Leg Day", "Rest", etc.)
// and optional workoutTypes tags to auto-tag the session
const daySchema = new mongoose.Schema({
  label:        { type: String, default: '' },       // legacy single label (kept for migration)
  labels:       [{ type: String }],                  // multi-select labels e.g. ["Push", "Core"]
  workoutTypes: [{ type: String }],                  // e.g. ["Push", "Chest", "Shoulders"]
  isRest:       { type: Boolean, default: false },
}, { _id: false });

const userRoutineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  days: {
    mon: { type: daySchema, default: () => ({}) },
    tue: { type: daySchema, default: () => ({}) },
    wed: { type: daySchema, default: () => ({}) },
    thu: { type: daySchema, default: () => ({}) },
    fri: { type: daySchema, default: () => ({}) },
    sat: { type: daySchema, default: () => ({}) },
    sun: { type: daySchema, default: () => ({}) },
  },
}, { timestamps: true });

export default mongoose.model('UserRoutine', userRoutineSchema);
