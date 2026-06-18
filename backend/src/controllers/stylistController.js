import mongoose from 'mongoose';
import Stylist from '../models/Stylist.js';
import Booking from '../models/Booking.js';
import GalleryItem from '../models/GalleryItem.js';
import Offer from '../models/Offer.js';
import Service from '../models/Service.js';
import { createPaystackSubaccount, listPaystackBanks } from '../services/paymentService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function timeToMinutes(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function dayKey(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
}

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

export const listStylists = asyncHandler(async (req, res) => {
  const { serviceCode, available, q } = req.query;
  const filter = { approvalStatus: 'approved' };
  if (serviceCode) filter.serviceCodes = serviceCode;
  if (available !== undefined) filter.available = available === 'true';
  if (q) filter.$text = { $search: q };

  const stylists = await Stylist.find(filter).populate('user', 'name email phone').populate('offerings.service', 'code title category imageUrl shortDescription').sort({ rating: -1, jobs: -1 });
  res.json({ success: true, data: stylists });
});

export const getStylist = asyncHandler(async (req, res) => {
  const lookup = mongoose.isValidObjectId(req.params.id)
    ? { $or: [{ _id: req.params.id }, { code: req.params.id }] }
    : { code: req.params.id };
  const stylist = await Stylist.findOne({ ...lookup, approvalStatus: 'approved' }).populate('user', 'name email phone').populate('offerings.service', 'code title category imageUrl shortDescription');
  if (!stylist) {
    res.status(404);
    throw new Error('Stylist not found');
  }
  res.json({ success: true, data: stylist });
});

export const createStylist = asyncHandler(async (req, res) => {
  const stylist = await Stylist.create(req.body);
  res.status(201).json({ success: true, data: stylist });
});

export const updateStylist = asyncHandler(async (req, res) => {
  const stylist = await Stylist.findById(req.params.id);
  if (!stylist) {
    res.status(404);
    throw new Error('Stylist not found');
  }
  if (req.user.role === 'stylist' && stylist.user?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only update your own stylist profile');
  }
  const allowed = ['name', 'role', 'bio', 'avatarUrl', 'skills', 'portfolio', 'serviceCodes', 'experienceYears', 'priceRange', 'availability', 'available'];
  for (const key of allowed) if (req.body[key] !== undefined) stylist[key] = req.body[key];
  await stylist.save();
  res.json({ success: true, data: stylist });
});

export const myStylistBookings = asyncHandler(async (req, res) => {
  const stylist = await Stylist.findOne({ user: req.user._id });
  if (!stylist) {
    res.status(404);
    throw new Error('Stylist profile not found');
  }
  if (stylist.approvalStatus !== 'approved') {
    res.status(403);
    throw new Error(`Your stylist application is ${stylist.approvalStatus}`);
  }
  const bookings = await Booking.find({ stylist: stylist._id })
    .populate('customer', 'name email phone')
    .populate('service', 'title durationMinutes')
    .populate('branch', 'name address')
    .sort({ appointmentDate: 1, startTime: 1 });
  res.json({ success: true, data: bookings });
});

async function approvedStylistFor(userId, includePayout = false) {
  const query = Stylist.findOne({ user: userId, approvalStatus: 'approved' });
  if (includePayout) query.select('+payout.paystackSubaccountCode');
  const stylist = await query;
  if (!stylist) {
    const error = new Error('Only approved stylists can use this feature');
    error.statusCode = 403;
    throw error;
  }
  return stylist;
}

function normalizeOfferCode(value, fallbackTitle = 'offer') {
  return String(value || fallbackTitle)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);
}

async function offerPayloadForStylist(req, stylist) {
  const discountValue = Number(req.body.discountValue);
  if (!req.body.title || !Number.isFinite(discountValue) || discountValue <= 0) {
    const error = new Error('Offer title and a valid discount are required');
    error.statusCode = 400;
    throw error;
  }
  if (req.body.discountType === 'percent' && discountValue > 80) {
    const error = new Error('Percentage discounts cannot be higher than 80%');
    error.statusCode = 400;
    throw error;
  }

  let service = null;
  if (req.body.serviceId) {
    service = await Service.findById(req.body.serviceId);
    const offersService = stylist.offerings?.some(item => item.isActive !== false && item.service?.toString() === req.body.serviceId);
    if (!service || !offersService) {
      const error = new Error('Choose one of your active services for this discount');
      error.statusCode = 400;
      throw error;
    }
  }

  const code = normalizeOfferCode(req.body.code, `${stylist.name}-${req.body.title}`);
  return {
    code,
    title: String(req.body.title).trim(),
    description: String(req.body.description || '').trim(),
    category: service?.category || req.body.category || 'all',
    badge: req.body.badge || 'Stylist deal',
    priceText: req.body.priceText || `${discountValue}${req.body.discountType === 'fixed' ? ' off' : '% off'}`,
    oldPriceText: req.body.oldPriceText || '',
    discountType: req.body.discountType === 'fixed' ? 'fixed' : 'percent',
    discountValue,
    minSpend: Number(req.body.minSpend || 0),
    maxUses: req.body.maxUses ? Number(req.body.maxUses) : undefined,
    expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
    service: service?._id,
    stylist: stylist._id,
    ownerType: 'stylist',
    createdBy: req.user._id,
    isActive: req.body.isActive !== false,
  };
}

export const payoutBanks = asyncHandler(async (req, res) => {
  await approvedStylistFor(req.user._id);
  res.json({ success: true, data: await listPaystackBanks() });
});

export const configurePayout = asyncHandler(async (req, res) => {
  const { bankCode, accountNumber, accountName } = req.body;
  if (!bankCode || !/^\d{10}$/.test(String(accountNumber || '')) || !accountName) {
    res.status(400);
    throw new Error('Bank, 10-digit account number, and account name are required');
  }
  const stylist = await approvedStylistFor(req.user._id, true);
  const subaccount = await createPaystackSubaccount({
    businessName: stylist.business?.name || stylist.name,
    bankCode,
    accountNumber,
    contact: req.user,
  });
  stylist.payout = {
    paystackSubaccountCode: subaccount.subaccount_code,
    bankCode,
    accountLast4: String(accountNumber).slice(-4),
    accountName,
    status: 'active',
    configuredAt: new Date(),
  };
  await stylist.save();
  res.json({ success: true, data: { bankCode, accountLast4: stylist.payout.accountLast4, accountName, status: 'active' } });
});

export const listMyOffers = asyncHandler(async (req, res) => {
  const stylist = await approvedStylistFor(req.user._id);
  const offers = await Offer.find({ ownerType: 'stylist', stylist: stylist._id })
    .populate('service', 'title code category')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: offers });
});

export const createMyOffer = asyncHandler(async (req, res) => {
  const stylist = await approvedStylistFor(req.user._id);
  const payload = await offerPayloadForStylist(req, stylist);
  const offer = await Offer.create(payload);
  await offer.populate('service', 'title code category');
  res.status(201).json({ success: true, data: offer });
});

export const updateMyOffer = asyncHandler(async (req, res) => {
  const stylist = await approvedStylistFor(req.user._id);
  const offer = await Offer.findOne({ _id: req.params.id, ownerType: 'stylist', stylist: stylist._id });
  if (!offer) {
    res.status(404);
    throw new Error('Discount not found');
  }
  const payload = await offerPayloadForStylist(req, stylist);
  Object.assign(offer, payload);
  await offer.save();
  await offer.populate('service', 'title code category');
  res.json({ success: true, data: offer });
});

export const deleteMyOffer = asyncHandler(async (req, res) => {
  const stylist = await approvedStylistFor(req.user._id);
  const offer = await Offer.findOneAndUpdate(
    { _id: req.params.id, ownerType: 'stylist', stylist: stylist._id },
    { isActive: false },
    { new: true },
  );
  if (!offer) {
    res.status(404);
    throw new Error('Discount not found');
  }
  res.json({ success: true, data: offer });
});

export const updateMyOfferings = asyncHandler(async (req, res) => {
  const stylist = await approvedStylistFor(req.user._id);
  const requested = Array.isArray(req.body.offerings) ? req.body.offerings : [];
  const ids = requested.map(item => item.serviceId);
  const services = await Service.find({ _id: { $in: ids }, isActive: true });
  const byId = new Map(services.map(service => [service._id.toString(), service]));
  if (services.length !== new Set(ids.map(String)).size) {
    res.status(400);
    throw new Error('One or more services are invalid');
  }
  stylist.offerings = requested.map(item => {
    const service = byId.get(String(item.serviceId));
    const price = Number(item.price);
    const durationMinutes = Number(item.durationMinutes || service.durationMinutes);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(durationMinutes) || durationMinutes < 5) {
      const error = new Error('Every offering needs a valid price and duration');
      error.statusCode = 400;
      throw error;
    }
    const minPrice = Number(service.minPrice ?? service.price ?? 0);
    const maxPrice = Number(service.maxPrice ?? service.price ?? Number.MAX_SAFE_INTEGER);
    if (price < minPrice || price > maxPrice) {
      const error = new Error(`${service.title} must be priced between ₦${minPrice} and ₦${maxPrice}`);
      error.statusCode = 400;
      throw error;
    }
    return {
      service: service._id,
      price,
      durationMinutes,
      description: String(item.description || '').trim(),
      imageUrl: String(item.imageUrl || '').trim(),
      isActive: item.isActive !== false,
    };
  });
  stylist.serviceCodes = services.map(service => service.code);
  await stylist.save();
  await stylist.populate('offerings.service', 'code title category imageUrl shortDescription');
  res.json({ success: true, data: stylist.offerings });
});

export const updateMyBusinessSettings = asyncHandler(async (req, res) => {
  const stylist = await approvedStylistFor(req.user._id);
  if (req.body.availability || req.body.closedDates) {
    const nextAvailability = req.body.availability || stylist.availability || [];
    const nextClosedDates = req.body.closedDates || stylist.closedDates || [];
    const futureBookings = await Booking.find({
      stylist: stylist._id,
      appointmentDate: { $gte: new Date(new Date().toISOString().slice(0, 10)) },
      status: { $in: ['pending', 'confirmed'] },
    }).select('appointmentDate startTime endTime bookingNumber');

    const closedSet = new Set(nextClosedDates.map(item => isoDay(new Date(item.date))));
    const scheduleByDay = new Map(nextAvailability.map(item => [item.day, item]));
    const blockedBooking = futureBookings.find(booking => {
      const bookingDate = isoDay(booking.appointmentDate);
      if (closedSet.has(bookingDate)) return true;
      const schedule = scheduleByDay.get(dayKey(booking.appointmentDate));
      if (!schedule || schedule.isAvailable === false) return true;
      const start = timeToMinutes(booking.startTime);
      const end = timeToMinutes(booking.endTime);
      const scheduleStart = timeToMinutes(schedule.startTime);
      const scheduleEnd = timeToMinutes(schedule.endTime);
      return start !== null && end !== null && scheduleStart !== null && scheduleEnd !== null && (start < scheduleStart || end > scheduleEnd);
    });

    if (blockedBooking) {
      res.status(409);
      throw new Error(`You already have booking ${blockedBooking.bookingNumber} during that time. Move or complete it before closing that schedule.`);
    }
  }
  const allowed = ['available', 'availability', 'closedDates', 'notificationPreferences', 'portfolioItems', 'name', 'role', 'bio', 'avatarUrl', 'skills'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) stylist[key] = req.body[key];
  }
  if (req.body.business) {
    const currentBusiness = stylist.business?.toObject?.() || stylist.business || {};
    stylist.business = {
      ...currentBusiness,
      ...req.body.business,
    };
  }
  if (req.body.name) {
    req.user.name = req.body.name;
    await req.user.save();
  }
  await stylist.save();
  res.json({ success: true, data: stylist });
});

export const uploadPortfolioImage = asyncHandler(async (req, res) => {
  const stylist = await approvedStylistFor(req.user._id);
  if (!req.file) {
    res.status(400);
    throw new Error('Portfolio photo or video is required');
  }
  const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  const item = {
    title: req.body.title || 'Portfolio work',
    imageUrl: `/${req.file.path}`,
    mediaType,
    createdAt: new Date(),
  };
  stylist.portfolioItems = [item, ...(stylist.portfolioItems || [])].slice(0, 30);
  await stylist.save();

  await GalleryItem.create({
    title: item.title,
    category: req.body.category || 'portfolio',
    emoji: mediaType === 'video' ? '▶' : '✦',
    imageUrl: item.imageUrl,
    mediaType,
    stylist: stylist._id,
    isActive: true,
  });

  res.status(201).json({ success: true, data: item });
});

export const deletePortfolioItem = asyncHandler(async (req, res) => {
  const stylist = await approvedStylistFor(req.user._id);
  const index = Number(req.params.index);
  const portfolioItems = stylist.portfolioItems || [];
  if (!Number.isInteger(index) || index < 0 || index >= portfolioItems.length) {
    res.status(404);
    throw new Error('Portfolio item not found');
  }

  const [removed] = portfolioItems.splice(index, 1);
  stylist.portfolioItems = portfolioItems;
  await stylist.save();

  if (removed?.imageUrl) {
    await GalleryItem.updateMany(
      { stylist: stylist._id, imageUrl: removed.imageUrl },
      { isActive: false },
    );
  }

  res.json({ success: true, data: removed });
});

export const uploadOfferingImage = asyncHandler(async (req, res) => {
  const stylist = await approvedStylistFor(req.user._id);
  if (!req.file) {
    res.status(400);
    throw new Error('Service image is required');
  }
  const offering = stylist.offerings?.find(item => item.service?.toString() === req.params.serviceId);
  if (!offering) {
    res.status(404);
    throw new Error('Add this service to your profile before uploading its image');
  }
  offering.imageUrl = `/${req.file.path}`;
  await stylist.save();
  res.status(201).json({ success: true, data: { serviceId: req.params.serviceId, imageUrl: offering.imageUrl } });
});

export const uploadProfileImage = asyncHandler(async (req, res) => {
  const stylist = await approvedStylistFor(req.user._id);
  if (!req.file) {
    res.status(400);
    throw new Error('Profile image is required');
  }
  stylist.avatarUrl = `/${req.file.path}`;
  req.user.avatarUrl = stylist.avatarUrl;
  await Promise.all([stylist.save(), req.user.save()]);
  res.status(201).json({ success: true, data: { avatarUrl: stylist.avatarUrl } });
});
