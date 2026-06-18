import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  stylist: { type: mongoose.Schema.Types.ObjectId, ref: 'Stylist' },
  name: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true },
  isApproved: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
