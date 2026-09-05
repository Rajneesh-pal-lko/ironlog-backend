import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key:    { type: String, required: true },
  items:  [{ type: String, trim: true }],
}, { timestamps: true });

settingsSchema.index({ userId: 1, key: 1 }, { unique: true });

export default mongoose.model('Settings', settingsSchema);
