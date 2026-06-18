import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, default: 'Lagos' },
  phone: String,
  hours: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Branch', branchSchema);
