import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  day: { type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] },
  startTime: String,
  endTime: String,
  isAvailable: { type: Boolean, default: true },
}, { _id: false });

const closedDateSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  reason: String,
}, { _id: false });

const portfolioItemSchema = new mongoose.Schema({
  title: String,
  imageUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const offeringSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  price: { type: Number, required: true, min: 0 },
  durationMinutes: { type: Number, required: true, min: 5 },
  description: String,
  imageUrl: String,
  isActive: { type: Boolean, default: true },
}, { _id: false });

const stylistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  bio: String,
  avatarUrl: String,
  rating: { type: Number, default: 0 },
  jobs: { type: Number, default: 0 },
  skills: [String],
  portfolio: [String],
  portfolioItems: [portfolioItemSchema],
  serviceCodes: [String],
  experienceYears: { type: Number, default: 0 },
  priceRange: String,
  available: { type: Boolean, default: true },
  availability: [availabilitySchema],
  closedDates: [closedDateSchema],
  offerings: [offeringSchema],
  notificationPreferences: {
    bookingEmails: { type: Boolean, default: true },
    statusEmails: { type: Boolean, default: true },
    dailySummary: { type: Boolean, default: false },
  },
  payout: {
    paystackSubaccountCode: { type: String, select: false },
    bankCode: String,
    accountLast4: String,
    accountName: String,
    status: { type: String, enum: ['not-configured', 'active', 'disabled'], default: 'not-configured' },
    configuredAt: Date,
  },
  business: {
    name: { type: String, trim: true },
    type: { type: String, enum: ['salon', 'independent'], default: 'independent' },
    registrationNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    idDocumentUrl: String,
    proofOfAddressUrl: String,
    shopPhotoUrl: String,
  },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending', index: true },
  applicationSubmittedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote: String,
}, { timestamps: true });

stylistSchema.index({ name: 'text', skills: 'text', role: 'text' });

export default mongoose.model('Stylist', stylistSchema);
