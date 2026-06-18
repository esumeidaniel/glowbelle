import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  title: { type: String, required: true },
  description: String,
  category: { type: String, default: 'all' },
  badge: String,
  priceText: String,
  oldPriceText: String,
  discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  discountValue: { type: Number, default: 0 },
  minSpend: { type: Number, default: 0 },
  maxUses: Number,
  usedCount: { type: Number, default: 0 },
  expiresAt: Date,
  ownerType: { type: String, enum: ['admin', 'stylist'], default: 'admin', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stylist: { type: mongoose.Schema.Types.ObjectId, ref: 'Stylist', index: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', index: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Offer', offerSchema);
