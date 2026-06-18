import Branch from '../models/Branch.js';
import Category from '../models/Category.js';
import ContactMessage from '../models/ContactMessage.js';
import GalleryItem from '../models/GalleryItem.js';
import Offer from '../models/Offer.js';
import Review from '../models/Review.js';
import Stylist from '../models/Stylist.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listCategories = asyncHandler(async (req, res) => {
  const items = await Category.find({ isActive: true }).sort({ sortOrder: 1, title: 1 });
  res.json({ success: true, data: items });
});

export const listBranches = asyncHandler(async (req, res) => {
  const items = await Branch.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, data: items });
});

export const listOffers = asyncHandler(async (req, res) => {
  const filter = {
    isActive: true,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: new Date() } }],
  };
  if (req.query.category && req.query.category !== 'all') {
    filter.$and = [{ $or: [{ category: req.query.category }, { category: 'all' }] }];
  }
  const items = await Offer.find(filter)
    .populate('stylist', 'name role avatarUrl code')
    .populate('service', 'title code category')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

export const validateOffer = asyncHandler(async (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const offer = await Offer.findOne({ code, isActive: true })
    .populate('stylist', 'name code')
    .populate('service', 'title code');
  if (!offer || (offer.expiresAt && offer.expiresAt < new Date())) {
    res.status(404);
    throw new Error('Promo code is not valid');
  }
  if (offer.ownerType === 'stylist') {
    if (!req.query.stylistId) {
      res.status(400);
      throw new Error('Choose the stylist before applying this stylist discount');
    }
    const offerStylistId = offer.stylist?._id?.toString?.() || offer.stylist?.toString();
    if (![offerStylistId, offer.stylist?.code].includes(req.query.stylistId)) {
      res.status(400);
      throw new Error('This promo code belongs to a different stylist');
    }
  }
  if (offer.service && req.query.serviceId) {
    const offerServiceId = offer.service?._id?.toString?.() || offer.service?.toString();
    if (![offerServiceId, offer.service?.code].includes(req.query.serviceId)) {
      res.status(400);
      throw new Error('This promo code is for a different service');
    }
  }
  res.json({ success: true, data: offer });
});

export const listGallery = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category && req.query.category !== 'all') filter.category = req.query.category;
  const items = await GalleryItem.find(filter)
    .populate('stylist', 'name role avatarUrl code')
    .populate('service', 'title code')
    .sort({ createdAt: -1 });

  const includePortfolio = !req.query.category || ['all', 'portfolio'].includes(req.query.category);
  if (!includePortfolio) {
    res.json({ success: true, data: items });
    return;
  }

  const knownUrls = new Set(items.map(item => item.imageUrl).filter(Boolean));
  const stylists = await Stylist.find({
    approvalStatus: 'approved',
    available: true,
    'portfolioItems.0': { $exists: true },
  }).select('name role avatarUrl code portfolioItems');

  const portfolioItems = stylists.flatMap(stylist => (stylist.portfolioItems || [])
    .filter(item => item.imageUrl && !knownUrls.has(item.imageUrl))
    .map((item, index) => ({
      _id: `${stylist._id}-portfolio-${index}`,
      title: item.title || 'Portfolio work',
      category: 'portfolio',
      emoji: item.mediaType === 'video' ? '▶' : '✦',
      imageUrl: item.imageUrl,
      mediaType: item.mediaType || 'image',
      stylist: {
        _id: stylist._id,
        name: stylist.name,
        role: stylist.role,
        avatarUrl: stylist.avatarUrl,
        code: stylist.code,
      },
      createdAt: item.createdAt,
    })));

  res.json({ success: true, data: [...items, ...portfolioItems] });
});

export const listReviews = asyncHandler(async (req, res) => {
  const filter = { isApproved: true };
  if (req.query.service) filter.service = req.query.service;
  if (req.query.stylist) filter.stylist = req.query.stylist;
  const items = await Review.find(filter).populate('service', 'title').populate('stylist', 'name').sort({ createdAt: -1 }).limit(Number(req.query.limit || 20));
  res.json({ success: true, data: items });
});

export const createContactMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.create(req.body);
  res.status(201).json({ success: true, data: message });
});
