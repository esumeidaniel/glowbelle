import mongoose from 'mongoose';

const galleryItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: String,
  emoji: String,
  imageUrl: String,
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  stylist: { type: mongoose.Schema.Types.ObjectId, ref: 'Stylist' },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('GalleryItem', galleryItemSchema);
