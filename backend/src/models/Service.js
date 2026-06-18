import mongoose from 'mongoose';

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, index: true },
  emoji: String,
  imageUrl: String,
  shortDescription: String,
  description: String,
  price: { type: Number, required: true, min: 0 },
  minPrice: { type: Number, min: 0 },
  maxPrice: { type: Number, min: 0 },
  durationMinutes: { type: Number, required: true, min: 5 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewsCount: { type: Number, default: 0 },
  addons: [addonSchema],
  prep: String,
  aftercare: String,
  gender: String,
  minAge: { type: Number, default: 0 },
  popularity: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

serviceSchema.index({ title: 'text', description: 'text', shortDescription: 'text' });

export default mongoose.model('Service', serviceSchema);
