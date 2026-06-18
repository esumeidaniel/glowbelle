import mongoose from 'mongoose';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Branch from '../models/Branch.js';
import Offer from '../models/Offer.js';
import Service from '../models/Service.js';
import Stylist from '../models/Stylist.js';
import { sendBookingNotifications, sendStatusNotification } from '../services/notificationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function normalizeAddonName(addon) {
  return String(typeof addon === 'string' ? addon.split('(')[0] : addon?.name || '').trim().toLowerCase();
}

export function resolveAddons(service, requestedAddons = []) {
  const available = new Map(service.addons.map(addon => [addon.name.trim().toLowerCase(), addon]));
  return requestedAddons.map(requested => {
    const addon = available.get(normalizeAddonName(requested));
    if (!addon) {
      const error = new Error('One or more selected add-ons are invalid for this service');
      error.statusCode = 400;
      throw error;
    }
    return { name: addon.name, price: addon.price };
  });
}

export function timeToMinutes(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (minute > 59 || hour > (meridiem ? 12 : 23)) return null;
  if (meridiem) {
    if (hour === 12) hour = 0;
    if (meridiem === 'PM') hour += 12;
  }
  return hour * 60 + minute;
}

function minutesToTime(totalMinutes) {
  const normalized = Math.max(0, totalMinutes) % (24 * 60);
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

async function calculatePricing({ service, stylist, addons = [], locationType = 'salon', promoCode }) {
  const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  const travelFee = locationType === 'home' ? 5000 : 0;
  const subtotal = service.price + addonsTotal + travelFee;
  let discount = 0;
  let normalizedPromo = promoCode?.trim().toUpperCase();
  let offer = null;

  if (normalizedPromo) {
    offer = await Offer.findOne({ code: normalizedPromo, isActive: true });
    if (!offer) {
      const error = new Error('Invalid promo code');
      error.statusCode = 400;
      throw error;
    }
    if (offer.expiresAt && offer.expiresAt < new Date()) {
      const error = new Error('Promo code has expired');
      error.statusCode = 400;
      throw error;
    }
    if (offer.maxUses && offer.usedCount >= offer.maxUses) {
      const error = new Error('Promo code usage limit has been reached');
      error.statusCode = 400;
      throw error;
    }
    if (subtotal < offer.minSpend) {
      const error = new Error(`Minimum spend for this promo is ₦${offer.minSpend}`);
      error.statusCode = 400;
      throw error;
    }
    if (offer.ownerType === 'stylist' && offer.stylist?.toString() !== stylist?._id?.toString()) {
      const error = new Error('This promo code belongs to a different stylist');
      error.statusCode = 400;
      throw error;
    }
    if (offer.service && offer.service.toString() !== service._id?.toString()) {
      const error = new Error('This promo code is for a different service');
      error.statusCode = 400;
      throw error;
    }
    discount = offer.discountType === 'fixed'
      ? offer.discountValue
      : Math.round(subtotal * (offer.discountValue / 100));
    discount = Math.min(discount, subtotal);
  }

  return { subtotal, travelFee, discount, total: subtotal - discount, promoCode: normalizedPromo, offerId: normalizedPromo ? offer?._id : undefined };
}

function appointmentDay(value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    const error = new Error('Appointment date is invalid');
    error.statusCode = 400;
    throw error;
  }
  return date;
}

function assertBookableTime({ appointmentDate, startMinutes, endMinutes, stylist }) {
  const now = new Date();
  const start = new Date(appointmentDate);
  start.setUTCHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  if (start <= now) {
    const error = new Error('Appointments must be booked in the future');
    error.statusCode = 400;
    throw error;
  }

  if (!stylist) return;
  if (!stylist.available) {
    const error = new Error('This stylist is not currently accepting bookings');
    error.statusCode = 409;
    throw error;
  }
  const selectedDate = appointmentDate.toISOString().slice(0, 10);
  const isClosedDate = stylist.closedDates?.some(item => {
    const value = item.date instanceof Date ? item.date : new Date(item.date);
    return !Number.isNaN(value.getTime()) && value.toISOString().slice(0, 10) === selectedDate;
  });
  if (isClosedDate) {
    const error = new Error('This stylist is closed on the selected date');
    error.statusCode = 409;
    throw error;
  }
  const day = appointmentDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
  const schedule = stylist.availability?.find(item => item.day === day && item.isAvailable);
  if (stylist.availability?.length && !schedule) {
    const error = new Error('This stylist is unavailable on the selected day');
    error.statusCode = 409;
    throw error;
  }
  if (schedule) {
    const scheduleStart = timeToMinutes(schedule.startTime);
    const scheduleEnd = timeToMinutes(schedule.endTime);
    if (scheduleStart === null || scheduleEnd === null || startMinutes < scheduleStart || endMinutes > scheduleEnd) {
      const error = new Error('The selected time is outside this stylist\'s working hours');
      error.statusCode = 409;
      throw error;
    }
  }
}

export const createBooking = asyncHandler(async (req, res) => {
  for (const field of ['guest', 'addons']) {
    if (typeof req.body[field] === 'string') {
      try { req.body[field] = JSON.parse(req.body[field]); } catch {
        res.status(400);
        throw new Error(`${field} must be valid JSON`);
      }
    }
  }
  const {
    serviceId,
    stylistId,
    branchId,
    locationType = 'salon',
    homeAddress,
    bookingFor = 'Me',
    appointmentDate,
    startTime,
    endTime,
    addons = [],
    notes,
    promoCode,
    paymentMethod = 'pay-salon',
    guest,
  } = req.body;

  if (!appointmentDate || !startTime) {
    res.status(400);
    throw new Error('Appointment date and start time are required');
  }

  if (paymentMethod !== 'pay-salon') {
    res.status(400);
    throw new Error('GlowBelle currently supports Pay at Salon only.');
  }

  if (!req.user && (!guest?.name || !guest?.phone || !guest?.email)) {
    res.status(400);
    throw new Error('Guest name, phone and email are required');
  }

  if (!stylistId) {
    res.status(400);
    throw new Error('Choose a stylist before booking so the appointment uses that stylist\'s own price and schedule');
  }

  const serviceLookup = mongoose.isValidObjectId(serviceId)
    ? { $or: [{ _id: serviceId }, { code: serviceId }] }
    : { code: serviceId };
  const service = await Service.findOne({ ...serviceLookup, isActive: true });
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  let stylist = null;
  let pricedService = service;
  const stylistLookup = mongoose.isValidObjectId(stylistId)
    ? { $or: [{ _id: stylistId }, { code: stylistId }] }
    : { code: stylistId };
  stylist = await Stylist.findOne({ ...stylistLookup, approvalStatus: 'approved', available: true });
  if (!stylist) {
    res.status(404);
    throw new Error('Stylist not found');
  }
  const offering = stylist.offerings?.find(item => item.isActive && item.service?.toString() === service._id.toString());
  if (!offering) {
    res.status(400);
    throw new Error('This stylist does not offer the selected service');
  }
  pricedService = { ...service.toObject(), price: offering.price, durationMinutes: offering.durationMinutes };

  let branch = null;
  if (locationType === 'salon') {
    const selectedBranchId = branchId || 'vi';
    const branchLookup = mongoose.isValidObjectId(selectedBranchId)
      ? { $or: [{ _id: selectedBranchId }, { code: selectedBranchId }] }
      : { code: selectedBranchId };
    branch = await Branch.findOne({ ...branchLookup, isActive: true });
    if (!branch) {
      res.status(404);
      throw new Error('Branch not found');
    }
  }

  const canonicalAddons = resolveAddons(pricedService, addons);
  const day = appointmentDay(appointmentDate);
  const startMinutes = timeToMinutes(startTime);
  if (startMinutes === null) {
    res.status(400);
    throw new Error('Start time is invalid');
  }
  const endMinutes = startMinutes + pricedService.durationMinutes;
  if (endMinutes > 24 * 60) {
    res.status(400);
    throw new Error('Appointment cannot end after midnight');
  }
  assertBookableTime({ appointmentDate: day, startMinutes, endMinutes, stylist });

  const conflictFilter = {
    appointmentDate: day,
    status: { $in: ['pending', 'confirmed'] },
  };
  if (stylist) conflictFilter.stylist = stylist._id;
  else if (branch) conflictFilter.branch = branch._id;

  const possibleConflicts = await Booking.find(conflictFilter).select('startTime endTime service').populate('service', 'durationMinutes');
  const conflictingBooking = possibleConflicts.find(existing => {
    const existingStart = timeToMinutes(existing.startTime);
    const existingEnd = timeToMinutes(existing.endTime) ?? existingStart + (existing.service?.durationMinutes || 60);
    return existingStart !== null && intervalsOverlap(startMinutes, endMinutes, existingStart, existingEnd);
  });

  if (conflictingBooking) {
    res.status(409);
    throw new Error(stylist ? 'This stylist is already booked for that date and time' : 'That salon time slot is already booked');
  }

  const pricing = await calculatePricing({ service: pricedService, stylist, addons: canonicalAddons, locationType, promoCode });
  const { offerId, ...bookingPricing } = pricing;
  const guestPaymentToken = req.user ? null : crypto.randomBytes(32).toString('hex');

  const booking = await Booking.create({
    customer: req.user?._id,
    guest: req.user ? undefined : guest,
    service: service._id,
    stylist: stylist?._id,
    branch: branch?._id,
    locationType,
    homeAddress,
    bookingFor,
    appointmentDate: day,
    startTime: minutesToTime(startMinutes),
    endTime: minutesToTime(endMinutes),
    addons: canonicalAddons,
    notes,
    inspirationImageUrl: req.file ? `/${req.file.path}` : undefined,
    paymentMethod,
    guestPaymentTokenHash: guestPaymentToken ? crypto.createHash('sha256').update(guestPaymentToken).digest('hex') : undefined,
    paymentProvider: 'cash',
    ...bookingPricing,
  });

  if (offerId) await Offer.findByIdAndUpdate(offerId, { $inc: { usedCount: 1 } });

  await sendBookingNotifications(booking);

  const populated = await Booking.findById(booking._id)
    .populate('customer', 'name email phone')
    .populate('service')
    .populate('stylist')
    .populate('branch');

  const data = populated.toObject();
  if (guestPaymentToken) data.guestPaymentToken = guestPaymentToken;
  res.status(201).json({ success: true, data });
});

export const myBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ customer: req.user._id })
    .populate('service')
    .populate('stylist')
    .populate('branch')
    .sort({ appointmentDate: -1, startTime: -1 });

  res.json({ success: true, data: bookings });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('service')
    .populate('stylist')
    .populate('branch');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const owner = booking.customer?._id?.toString() === req.user._id.toString();
  if (!owner && !['admin', 'stylist'].includes(req.user.role)) {
    res.status(403);
    throw new Error('You cannot view this booking');
  }

  res.json({ success: true, data: booking });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, cancellationReason, paymentStatus } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (req.user.role === 'stylist') {
    const assignedStylist = await Stylist.findOne({ user: req.user._id, _id: booking.stylist, approvalStatus: 'approved' });
    if (!assignedStylist) {
      res.status(403);
      throw new Error('You can only update bookings assigned to you');
    }
    if (paymentStatus || !['confirmed', 'completed', 'cancelled'].includes(status)) {
      res.status(403);
      throw new Error('Stylists cannot change payment status or use this booking status');
    }
  }

  const previousStatus = booking.status;
  if (status) booking.status = status;
  if (paymentStatus) {
    booking.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid' && !booking.paidAt) booking.paidAt = new Date();
  }
  if (cancellationReason) booking.cancellationReason = cancellationReason;
  await booking.save();
  if (status && status !== previousStatus) await sendStatusNotification(booking);

  const populated = await Booking.findById(booking._id)
    .populate('customer', 'name email phone')
    .populate('service')
    .populate('stylist')
    .populate('branch');
  res.json({ success: true, data: populated });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  const owner = booking.customer?.toString() === req.user._id.toString();
  if (!owner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You cannot cancel this booking');
  }
  booking.status = 'cancelled';
  booking.cancellationReason = req.body.reason || 'Cancelled by user';
  await booking.save();
  await sendStatusNotification(booking);
  res.json({ success: true, data: booking });
});
