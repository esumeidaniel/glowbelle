import mongoose from 'mongoose';
import Service from '../models/Service.js';
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

export const listServices = asyncHandler(async (req, res) => {
  const {
    category,
    q,
    minPrice,
    maxPrice,
    minRating,
    sort = 'popular',
    featured,
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

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Service.find(filter).sort(sortMap[sort] || sortMap.popular).skip(skip).limit(Number(limit)),
    Service.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
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
