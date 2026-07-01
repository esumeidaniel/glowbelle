import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Stylist from '../models/Stylist.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';
import { sendAccountDeletionCodeEmail, sendPasswordChangeCodeEmail, sendPasswordResetCodeEmail, sendVerificationCodeEmail } from '../services/notificationService.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function sendAuth(res, user, status = 200) {
  const safeUser = user.toObject ? user.toObject() : user;
  delete safeUser.password;
  delete safeUser.emailVerificationCode;
  delete safeUser.emailVerificationExpires;
  delete safeUser.passwordResetCode;
  delete safeUser.passwordResetExpires;
  res.status(status).json({ success: true, token: signToken(user), data: safeUser });
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function sendNewVerificationCode(user) {
  const code = user.createEmailVerificationCode();
  await user.save({ validateBeforeSave: false });
  await sendVerificationCodeEmail({ to: user.email, name: user.name, code });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const exists = await User.findOne({ email: normalizedEmail }).select('+emailVerificationCode +emailVerificationExpires');
  if (exists && exists.emailVerified) {
    res.status(409);
    throw new Error('Email is already registered');
  }

  let user = exists;
  if (user && !user.emailVerified) {
    user.name = name;
    user.phone = phone;
    user.password = password;
    user.authProvider = 'local';
  } else {
    user = new User({ name, email: normalizedEmail, phone, password, role: 'customer', authProvider: 'local', emailVerified: false });
  }

  await sendNewVerificationCode(user);

  res.status(201).json({
    success: true,
    message: 'Verification code sent to your email. Please verify your account to finish registration.',
    pendingVerification: true,
    email: user.email,
  });
});

export const registerStylist = asyncHandler(async (req, res) => {
  const {
    name, email, phone, password, businessName, businessType = 'independent',
    registrationNumber, businessAddress, city, state, experienceYears = 0,
    bio = '', serviceCodes = '[]', consent,
  } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const idDocument = req.files?.idDocument?.[0];
  const proofOfAddress = req.files?.proofOfAddress?.[0];
  const shopPhoto = req.files?.shopPhoto?.[0];

  if (!name || !normalizedEmail || !phone || !password || !businessName || !businessAddress || !city || !state) {
    res.status(400);
    throw new Error('Personal and business contact details are required');
  }
  if (!idDocument || !proofOfAddress || !shopPhoto) {
    res.status(400);
    throw new Error('Identity document, proof of address, and shop/workspace photo are required');
  }
  if (consent !== 'true' && consent !== true) {
    res.status(400);
    throw new Error('You must confirm that the application information is accurate');
  }
  if (String(password).length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }
  if (await User.exists({ email: normalizedEmail })) {
    res.status(409);
    throw new Error('Email is already registered');
  }

  let parsedServices = [];
  try { parsedServices = JSON.parse(serviceCodes || '[]'); } catch {
    res.status(400);
    throw new Error('Selected services are invalid');
  }

  const user = await User.create({
    name, email: normalizedEmail, phone, password, role: 'stylist', authProvider: 'local', emailVerified: false,
  });
  try {
    await Stylist.create({
      user: user._id,
      code: `stylist-${user._id}`,
      name,
      role: 'Stylist',
      bio,
      serviceCodes: Array.isArray(parsedServices) ? parsedServices : [],
      experienceYears: Number(experienceYears) || 0,
      available: false,
      approvalStatus: 'pending',
      business: {
        name: businessName,
        type: businessType,
        registrationNumber,
        address: businessAddress,
        city,
        state,
        idDocumentUrl: idDocument.path,
        proofOfAddressUrl: proofOfAddress.path,
        shopPhotoUrl: shopPhoto.path,
      },
    });
    await sendNewVerificationCode(user);
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }

  res.status(201).json({
    success: true,
    message: 'Application received. Verify your email while an admin reviews your business documents.',
    pendingVerification: true,
    approvalStatus: 'pending',
    email: user.email,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+emailVerificationCode +emailVerificationExpires');

  if (!user || !user.verifyEmailCode(code)) {
    res.status(400);
    throw new Error('Invalid or expired verification code');
  }

  user.emailVerified = true;
  user.emailVerificationCode = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  sendAuth(res, user);
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+emailVerificationCode +emailVerificationExpires');

  if (!user) {
    res.status(404);
    throw new Error('No account found with that email');
  }

  if (user.emailVerified) {
    res.status(400);
    throw new Error('This email is already verified');
  }

  await sendNewVerificationCode(user);
  res.json({
    success: true,
    message: 'A new verification code has been sent to your email.',
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.role === 'stylist' && user.authProvider === 'local' && !user.emailVerified) {
    const approvedStylist = await Stylist.findOne({ user: user._id, approvalStatus: 'approved' });
    if (approvedStylist) {
      user.emailVerified = true;
      user.emailVerificationCode = undefined;
      user.emailVerificationExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }
  }

  if (user.authProvider === 'local' && !user.emailVerified) {
    await sendNewVerificationCode(user);
    res.status(403);
    throw new Error('Please verify your email first. A new verification code has been sent to your email.');
  }

  if (user.status !== 'active') {
    res.status(403);
    throw new Error('This account is suspended');
  }

  sendAuth(res, user);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+passwordResetCode +passwordResetExpires');

  // Avoid exposing whether an email exists.
  if (user) {
    const code = user.createPasswordResetCode();
    await user.save({ validateBeforeSave: false });
    await sendPasswordResetCodeEmail({ to: user.email, name: user.name, code });
  }

  res.json({ success: true, message: 'If that email exists, a password reset code has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body;
  if (!email || !code || !password) {
    res.status(400);
    throw new Error('Email, reset code and new password are required');
  }

  if (String(password).length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findOne({ email: normalizeEmail(email) }).select('+password +passwordResetCode +passwordResetExpires');
  if (!user || !user.verifyPasswordResetCode(code)) {
    res.status(400);
    throw new Error('Invalid or expired reset code');
  }

  user.password = password;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.emailVerified = true;
  user.authProvider = user.authProvider || 'local';
  await user.save();

  sendAuth(res, user);
});

export const requestPasswordChange = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordResetCode +passwordResetExpires');
  const code = user.createPasswordResetCode();
  await user.save({ validateBeforeSave: false });
  await sendPasswordChangeCodeEmail({ to: user.email, name: user.name, code });

  res.json({ success: true, message: 'A password change code has been sent to your email.' });
});

export const confirmPasswordChange = asyncHandler(async (req, res) => {
  const { code, currentPassword, password } = req.body;
  if (!code || !currentPassword || !password) {
    res.status(400);
    throw new Error('Current password, verification code and new password are required');
  }

  if (String(password).length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password +passwordResetCode +passwordResetExpires');
  if (!user || !user.verifyPasswordResetCode(code)) {
    res.status(400);
    throw new Error('Invalid or expired password change code');
  }
  if (user.password && !(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = password;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.authProvider = user.authProvider || 'local';
  await user.save();

  res.json({ success: true, message: 'Your password has been changed successfully.' });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!process.env.GOOGLE_CLIENT_ID) {
    res.status(500);
    throw new Error('Google login is not configured on the server');
  }

  if (!credential) {
    res.status(400);
    throw new Error('Google credential is required');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload?.sub) {
    res.status(401);
    throw new Error('Google account could not be verified');
  }

  const email = payload.email.toLowerCase();
  let user = await User.findOne({ email }).select('+password');

  if (user) {
    user.googleId = user.googleId || payload.sub;
    user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
    user.emailVerified = Boolean(payload.email_verified) || user.emailVerified;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    user.avatarUrl = user.avatarUrl || payload.picture;
    if (!user.name && payload.name) user.name = payload.name;
    await user.save({ validateBeforeSave: false });
  } else {
    user = await User.create({
      name: payload.name || email.split('@')[0],
      email,
      avatarUrl: payload.picture,
      googleId: payload.sub,
      emailVerified: Boolean(payload.email_verified),
      authProvider: 'google',
      role: 'customer',
    });
  }

  if (user.status !== 'active') {
    res.status(403);
    throw new Error('This account is suspended');
  }

  sendAuth(res, user);
});

export const me = asyncHandler(async (req, res) => {
  const stylistProfile = req.user.role === 'stylist'
    ? await Stylist.findOne({ user: req.user._id }).populate('offerings.service', 'code title category price durationMinutes imageUrl shortDescription')
    : null;

  res.json({ success: true, data: { user: req.user, stylistProfile } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'avatarUrl', 'gender', 'birthday', 'addresses', 'preferredLocationArea', 'children', 'notificationPreferences', 'preferences'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  }
  await req.user.save();
  res.json({ success: true, data: req.user });
});

export const requestAccountDeletion = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+accountDeletionCode +accountDeletionExpires');
  const code = user.createAccountDeletionCode();
  await user.save({ validateBeforeSave: false });
  await sendAccountDeletionCodeEmail({ to: user.email, name: user.name, code });
  res.json({ success: true, message: 'An account deletion code has been sent to your email.' });
});

export const confirmAccountDeletion = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.user._id).select('+accountDeletionCode +accountDeletionExpires');
  if (!code || !user || !user.verifyAccountDeletionCode(code)) {
    res.status(400);
    throw new Error('Invalid or expired account deletion code');
  }

  user.name = 'Deleted user';
  user.email = `deleted-${user._id}@deleted.glowbelle.local`;
  user.phone = undefined;
  user.gender = undefined;
  user.birthday = undefined;
  user.avatarUrl = undefined;
  user.addresses = [];
  user.preferredLocationArea = undefined;
  user.children = [];
  user.preferences = undefined;
  user.googleId = undefined;
  user.notificationPreferences = undefined;
  user.emailVerificationCode = undefined;
  user.emailVerificationExpires = undefined;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.accountDeletionCode = undefined;
  user.accountDeletionExpires = undefined;
  user.status = 'deleted';
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Your account has been deleted and personal information anonymized.' });
});
