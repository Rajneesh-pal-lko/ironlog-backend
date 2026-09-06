import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:         { type: String, required: true, trim: true },
  muscleGroup:  { type: String, trim: true, default: '' },
  subCategory:  { type: String, trim: true, default: '' },
  equipment:    { type: String, trim: true, default: '' },
  movementType: { type: String, trim: true, default: '' },
  unilateral:   { type: Boolean, default: false },
  notes:        { type: String, trim: true, default: '' },
  active:       { type: Boolean, default: true },
  favourite:    { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Exercise', exerciseSchema);
