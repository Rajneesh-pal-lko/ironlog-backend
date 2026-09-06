import mongoose from 'mongoose';

const setSchema = new mongoose.Schema({
  setNumber:    { type: Number, required: true },
  weight:       { type: Number, default: 0 },
  reps:         { type: Number, default: 0 },
  // Unilateral fields
  leftWeight:   { type: Number, default: 0 },
  leftReps:     { type: Number, default: 0 },
  rightWeight:  { type: Number, default: 0 },
  rightReps:    { type: Number, default: 0 },
  unit:         { type: String, enum: ['kg', 'lbs'], default: 'kg' },
  duration:     { type: Number, default: 0 }, // seconds, for timed exercises
  restSeconds:  { type: Number, default: 0 }, // rest taken after this set
}, { _id: true });

const sessionExerciseSchema = new mongoose.Schema({
  exerciseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  exerciseName: { type: String, required: true }, // snapshot in case exercise is deleted
  muscleGroup:  { type: String, default: '' },
  unilateral:   { type: Boolean, default: false },
  isBodyweight: { type: Boolean, default: false }, // no weight input needed
  isTimed:      { type: Boolean, default: false },  // duration instead of reps
  order:        { type: Number, default: 0 },
  sets:         [setSchema],
  notes:        { type: String, default: '' },
}, { _id: true });

const workoutSessionSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:         { type: Date, default: Date.now },
  workoutTypes: [{ type: String }], // e.g. ['Chest', 'Push', 'Upper Body']
  exercises:    [sessionExerciseSchema],
  startTime:    { type: Date },
  endTime:      { type: Date },
  notes:        { type: String, default: '' },
  status:       { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
}, { timestamps: true });

export default mongoose.model('WorkoutSession', workoutSessionSchema);
