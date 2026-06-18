import mongoose from 'mongoose';

const bookingAddonSchema = new mongoose.Schema({
  name: String,
  price: { type: Number, default: 0 },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, unique: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guest: {
    name: String,
    email: String,
    phone: String,
  },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  stylist: { type: mongoose.Schema.Types.ObjectId, ref: 'Stylist' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  locationType: { type: String, enum: ['salon', 'home'], default: 'salon' },
  homeAddress: String,
  bookingFor: { type: String, default: 'Me' },
  appointmentDate: { type: Date, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: String,
  addons: [bookingAddonSchema],
  notes: String,
  inspirationImageUrl: String,
  promoCode: String,
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  travelFee: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['pay-salon', 'pay-card', 'pay-transfer', 'pay-wallet'], default: 'pay-salon' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentReference: { type: String, index: true },
  guestPaymentTokenHash: { type: String, select: false },
  paymentProvider: { type: String, enum: ['paystack', 'cash', 'transfer', 'wallet'], default: 'cash' },
  paidAt: Date,
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'], default: 'pending', index: true },
  cancellationReason: String,
}, { timestamps: true });

bookingSchema.pre('save', function makeBookingNumber(next) {
  if (!this.bookingNumber) {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.bookingNumber = `GB-${day}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  next();
});

export default mongoose.model('Booking', bookingSchema);
