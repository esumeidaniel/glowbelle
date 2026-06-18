import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';

const childProfileSchema = new mongoose.Schema({
  name: String,
  age: Number,
  notes: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: {
    type: String,
    required: function passwordRequired() {
      return this.authProvider !== 'google';
    },
    minlength: 6,
    select: false,
  },
  role: { type: String, enum: ['customer', 'stylist', 'admin'], default: 'customer' },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  googleId: { type: String, index: true, sparse: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationCode: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  passwordResetCode: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  accountDeletionCode: { type: String, select: false },
  accountDeletionExpires: { type: Date, select: false },
  avatarUrl: String,
  addresses: [{ label: String, street: String, city: String, state: String, isDefault: Boolean }],
  children: [childProfileSchema],
  loyaltyPoints: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  notificationPreferences: {
    emailConfirmations: { type: Boolean, default: true },
    smsReminders: { type: Boolean, default: true },
    whatsappUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
    stylistAvailability: { type: Boolean, default: false },
  },
  status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },
}, { timestamps: true });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.password || !this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function matchPassword(password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

userSchema.methods.createEmailVerificationCode = function createEmailVerificationCode() {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  this.emailVerificationCode = crypto.createHash('sha256').update(code).digest('hex');
  this.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
  return code;
};

userSchema.methods.createPasswordResetCode = function createPasswordResetCode() {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  this.passwordResetCode = crypto.createHash('sha256').update(code).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return code;
};

userSchema.methods.createAccountDeletionCode = function createAccountDeletionCode() {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  this.accountDeletionCode = crypto.createHash('sha256').update(code).digest('hex');
  this.accountDeletionExpires = Date.now() + 10 * 60 * 1000;
  return code;
};

userSchema.methods.verifyEmailCode = function verifyEmailCode(code) {
  if (!this.emailVerificationCode || !this.emailVerificationExpires) return false;
  const hashed = crypto.createHash('sha256').update(String(code)).digest('hex');
  return this.emailVerificationCode === hashed && this.emailVerificationExpires > Date.now();
};

userSchema.methods.verifyPasswordResetCode = function verifyPasswordResetCode(code) {
  if (!this.passwordResetCode || !this.passwordResetExpires) return false;
  const hashed = crypto.createHash('sha256').update(String(code)).digest('hex');
  return this.passwordResetCode === hashed && this.passwordResetExpires > Date.now();
};

userSchema.methods.verifyAccountDeletionCode = function verifyAccountDeletionCode(code) {
  if (!this.accountDeletionCode || !this.accountDeletionExpires) return false;
  const hashed = crypto.createHash('sha256').update(String(code)).digest('hex');
  return this.accountDeletionCode === hashed && this.accountDeletionExpires > Date.now();
};

export default mongoose.model('User', userSchema);
