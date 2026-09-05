import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  muscleGroup:  { type: String, trim: true, default: '' },
  subCategory:  { type: String, trim: true, default: '' },
  equipment:    { type: String, trim: true, default: '' },
  movementType: { type: String, trim: true, default: '' },
  unilateral:   { type: Boolean, default: false },
  notes:        { type: String, trim: true, default: '' },
  active:       { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Exercise', exerciseSchema);
