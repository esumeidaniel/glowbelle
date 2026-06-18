import Booking from '../models/Booking.js';
import ContactMessage from '../models/ContactMessage.js';
import Offer from '../models/Offer.js';
import Service from '../models/Service.js';
import Stylist from '../models/Stylist.js';
import { sendEmail } from '../services/notificationService.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import path from 'path';

export const dashboardStats = asyncHandler(async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [bookings, todayBookings, pendingBookings, customers, services, stylists, approvedStylists, pendingStylists, revenueResult, unreadMessages] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ appointmentDate: { $gte: startOfToday, $lt: endOfToday } }),
    Booking.countDocuments({ status: 'pending' }),
    User.countDocuments({ role: 'customer' }),
    Service.countDocuments({ isActive: true }),
    Stylist.countDocuments(),
    Stylist.countDocuments({ approvalStatus: 'approved' }),
    Stylist.countDocuments({ approvalStatus: 'pending' }),
    Booking.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),
    ContactMessage.countDocuments({ status: 'new' }),
  ]);

  res.json({
    success: true,
    data: {
      bookings,
      todayBookings,
      pendingBookings,
      customers,
      services,
      stylists,
      approvedStylists,
      pendingStylists,
      revenueThisMonth: revenueResult[0]?.revenue || 0,
      unreadMessages,
    },
  });
});

export const listAllBookings = asyncHandler(async (req, res) => {
  const { status, from, to, page = 1, limit = 50, search } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (from || to) {
    filter.appointmentDate = {};
    if (from) filter.appointmentDate.$gte = new Date(from);
    if (to) filter.appointmentDate.$lte = new Date(to);
  }
  if (search) {
    filter.$or = [
      { bookingNumber: new RegExp(search, 'i') },
      { 'guest.name': new RegExp(search, 'i') },
      { 'guest.email': new RegExp(search, 'i') },
      { 'guest.phone': new RegExp(search, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate('customer', 'name email phone')
      .populate('service', 'title price durationMinutes')
      .populate('stylist', 'name role')
      .populate('branch', 'name address')
      .sort({ appointmentDate: 1, startTime: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

export const listCustomers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { role: 'customer' };
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
    ];
  }
  const customers = await User.find(filter).select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: customers });
});

export const listStylistApplications = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.approvalStatus = req.query.status;
  const applications = await Stylist.find(filter)
    .populate('user', 'name email phone emailVerified status createdAt')
    .populate('reviewedBy', 'name email')
    .sort({ applicationSubmittedAt: -1 });
  res.json({ success: true, data: applications });
});

export const reviewStylistApplication = asyncHandler(async (req, res) => {
  const { decision, note = '' } = req.body;
  if (!['approved', 'rejected', 'suspended'].includes(decision)) {
    res.status(400);
    throw new Error('Decision must be approved, rejected, or suspended');
  }
  const stylist = await Stylist.findById(req.params.id).populate('user', 'name email status emailVerified');
  if (!stylist) {
    res.status(404);
    throw new Error('Stylist application not found');
  }
  stylist.approvalStatus = decision;
  stylist.available = decision === 'approved';
  stylist.reviewedAt = new Date();
  stylist.reviewedBy = req.user._id;
  stylist.reviewNote = note;
  await stylist.save();

  if (decision === 'approved' && stylist.user) {
    await User.findByIdAndUpdate(stylist.user._id, {
      $set: { emailVerified: true, status: 'active' },
      $unset: { emailVerificationCode: '', emailVerificationExpires: '' },
    });
  }

  await sendEmail({
    to: stylist.user?.email,
    subject: decision === 'approved' ? 'Your GlowBelle professional account is approved' : `GlowBelle stylist application ${decision}`,
    html: decision === 'approved'
      ? `<h2>Your GlowBelle professional account is approved</h2><p>${note || 'You can now sign in, choose the services you offer, set your prices, and receive customer bookings.'}</p>`
      : `<h2>Your stylist application is ${decision}</h2><p>${note || 'Contact support if you need more information.'}</p>`,
    text: decision === 'approved'
      ? `Your GlowBelle professional account is approved. ${note || 'You can now sign in, choose services, set prices, and receive customer bookings.'}`
      : `Your GlowBelle stylist application is ${decision}. ${note}`,
  });
  res.json({ success: true, data: stylist });
});

export const downloadStylistDocument = asyncHandler(async (req, res) => {
  const fields = { id: 'idDocumentUrl', address: 'proofOfAddressUrl', workspace: 'shopPhotoUrl' };
  const field = fields[req.params.type];
  if (!field) {
    res.status(400);
    throw new Error('Unknown verification document type');
  }
  const stylist = await Stylist.findById(req.params.id).select(`business.${field}`);
  const filePath = stylist?.business?.[field];
  if (!filePath) {
    res.status(404);
    throw new Error('Verification document not found');
  }
  const allowedRoot = path.resolve(process.env.VERIFICATION_UPLOAD_DIR || 'verification-uploads');
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(`${allowedRoot}${path.sep}`)) {
    res.status(403);
    throw new Error('Invalid verification document path');
  }
  res.sendFile(resolved);
});

export const listAdminOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find().sort({ createdAt: -1 });
  res.json({ success: true, data: offers });
});

export const createOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.create(req.body);
  res.status(201).json({ success: true, data: offer });
});

export const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!offer) {
    res.status(404);
    throw new Error('Offer not found');
  }
  res.json({ success: true, data: offer });
});

export const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!offer) {
    res.status(404);
    throw new Error('Offer not found');
  }
  res.json({ success: true, data: offer });
});
