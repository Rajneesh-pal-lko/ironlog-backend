import mongoose from 'mongoose';

// Single document that stores user-managed lists (equipment, movement types)
const settingsSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  items: [{ type: String, trim: true }],
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
