import mongoose from 'mongoose';
import Service from '../models/Service.js';
import Stylist from '../models/Stylist.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function normalizePriceRange(body) {
  if (!body || typeof body !== 'object') return;
  const price = Number(body.price);
  if (body.minPrice === undefined || body.minPrice === '') body.minPrice = Number.isFinite(price) ? price : 0;
  if (body.maxPrice === undefined || body.maxPrice === '') body.maxPrice = Number.isFinite(price) ? price : body.minPrice;
  body.minPrice = Number(body.minPrice);
  body.maxPrice = Number(body.maxPrice);
  if (!Number.isFinite(body.minPrice) || !Number.isFinite(body.maxPrice) || body.minPrice < 0 || body.maxPrice < body.minPrice) {
    const error = new Error('Service price range must have a valid minimum and maximum price');
    error.statusCode = 400;
    throw error;
  }
}

function serviceKey(service) {
  return String(service._id || service.id || service.code || '');
}

function offeringMatchesService(offering, service) {
  const linked = offering?.service;
  const serviceId = serviceKey(service);
  const serviceCode = String(service.code || '');
  return String(linked?._id || linked) === serviceId || (serviceCode && String(linked?.code || '') === serviceCode);
}

async function enrichServicesForCustomers(services) {
  const plainServices = services.map(service => typeof service.toObject === 'function' ? service.toObject() : service);
  const ids = plainServices.map(service => service._id).filter(Boolean);
  if (!ids.length) return plainServices;

  const stylists = await Stylist.find({
    approvalStatus: 'approved',
    available: { $ne: false },
    'offerings.service': { $in: ids },
  })
    .select('name code rating jobs available offerings')
    .populate('offerings.service', 'code title category imageUrl shortDescription')
    .lean();

  return plainServices.map(service => {
    const offerings = stylists
      .map(stylist => ({
        stylist: {
          _id: stylist._id,
          code: stylist.code,
          name: stylist.name,
          rating: stylist.rating,
          jobs: stylist.jobs,
        },
        offering: (stylist.offerings || []).find(item => item.isActive !== false && offeringMatchesService(item, service)),
      }))
      .filter(item => item.offering)
      .sort((a, b) => Number(a.offering.price || 0) - Number(b.offering.price || 0));

    const primary = offerings[0];
    return {
      ...service,
      providerCount: offerings.length,
      primaryStylist: primary?.stylist,
      primaryOffering: primary?.offering,
      displayImageUrl: primary?.offering?.imageUrl || service.imageUrl || '',
      displayPrice: primary?.offering?.price ?? service.price,
      displayDurationMinutes: primary?.offering?.durationMinutes ?? service.durationMinutes,
      displayDescription: primary?.offering?.description || service.shortDescription || service.description || '',
    };
  });
}

export const listServices = asyncHandler(async (req, res) => {
  const {
    category,
    q,
    minPrice,
    maxPrice,
    minRating,
    sort = 'popular',
    featured,
    bookableOnly,
    page = 1,
    limit = 30,
  } = req.query;

  const filter = { isActive: true };
  if (category && category !== 'all') filter.category = category;
  if (featured !== undefined) filter.isFeatured = featured === 'true';
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (q) filter.$text = { $search: q };

  const sortMap = {
    popular: { popularity: -1, rating: -1 },
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1 },
  };

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const allItems = await Service.find(filter).sort(sortMap[sort] || sortMap.popular);
  const enriched = await enrichServicesForCustomers(allItems);
  const visible = bookableOnly === 'true'
    ? enriched.filter(service => Number(service.providerCount || 0) > 0)
    : enriched;
  const total = visible.length;
  const skip = (pageNumber - 1) * limitNumber;
  const items = visible.slice(skip, skip + limitNumber);

  res.json({ success: true, data: items, meta: { total, page: pageNumber, pages: Math.ceil(total / limitNumber) } });
});

export const getService = asyncHandler(async (req, res) => {
  const lookup = mongoose.isValidObjectId(req.params.id)
    ? { $or: [{ _id: req.params.id }, { code: req.params.id }] }
    : { code: req.params.id };
  const service = await Service.findOne({ ...lookup, isActive: true });
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  res.json({ success: true, data: service });
});

export const createService = asyncHandler(async (req, res) => {
  normalizePriceRange(req.body);
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, data: service });
});

export const updateService = asyncHandler(async (req, res) => {
  normalizePriceRange(req.body);
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  res.json({ success: true, data: service });
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  res.json({ success: true, data: service });
});
