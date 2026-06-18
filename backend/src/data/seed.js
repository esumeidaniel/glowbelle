import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Branch from '../models/Branch.js';
import Category from '../models/Category.js';
import GalleryItem from '../models/GalleryItem.js';
import Offer from '../models/Offer.js';
import Review from '../models/Review.js';
import Service from '../models/Service.js';
import Stylist from '../models/Stylist.js';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';
import { branches, categories, gallery, offers, reviews, services, stylists } from './frontendSeedSource.js';

dotenv.config();

function parseDuration(value = '') {
  const text = String(value).toLowerCase();
  const hours = Number((text.match(/([0-9.]+)h/) || [0, 0])[1]);
  const mins = Number((text.match(/([0-9.]+)m/) || [0, 0])[1]);
  return Math.round((hours * 60) + mins) || 60;
}

function parseAddon(value = '') {
  const priceMatch = value.match(/₦([\d,]+)/);
  return {
    name: value.split('(')[0].trim(),
    price: priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : 0,
  };
}

function parseOfferDiscount(offer) {
  const text = `${offer.price} ${offer.text}`;
  const percent = text.match(/(\d+)%/);
  const fixed = text.match(/₦([\d,]+)/);

  if (percent) return { discountType: 'percent', discountValue: Number(percent[1]) };
  if (fixed && offer.code === 'REFER3K') return { discountType: 'fixed', discountValue: 3000 };
  return { discountType: 'percent', discountValue: 10 };
}

async function dropLegacyIndexes() {
  try {
    const indexes = await Category.collection.indexes();
    if (indexes.some(index => index.name === 'name_1')) {
      await Category.collection.dropIndex('name_1');
    }
  } catch {
    // The categories collection may not exist yet on a fresh database.
  }
}

async function seed() {
  await connectDB();
  await dropLegacyIndexes();

  await Promise.all([
    User.deleteMany(),
    Category.deleteMany(),
    Service.deleteMany(),
    Stylist.deleteMany(),
    Branch.deleteMany(),
    Offer.deleteMany(),
    GalleryItem.deleteMany(),
    Review.deleteMany(),
  ]);

  const admin = await User.create({
    name: process.env.SEED_ADMIN_NAME || 'GlowBelle Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@glowbelle.com',
    phone: process.env.SEED_ADMIN_PHONE || '+2348001000000',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
    role: 'admin',
    emailVerified: true,
  });

  const stylistUser = await User.create({
    name: 'Emma Johnson',
    email: 'stylist@glowbelle.com',
    phone: '+2348001000004',
    password: 'Stylist123!',
    role: 'stylist',
    emailVerified: true,
  });

  await User.create({
    name: 'Demo Customer',
    email: 'customer@glowbelle.com',
    phone: '+2348001000005',
    password: 'Customer123!',
    role: 'customer',
    emailVerified: true,
    loyaltyPoints: 180,
  });

  await Category.insertMany(categories.map((category, index) => ({
    slug: category.id,
    title: category.title,
    description: category.desc,
    icon: category.icon,
    sortOrder: index,
  })));

  const createdServices = await Service.insertMany(services.map((service, index) => ({
    code: service.id,
    title: service.title,
    category: service.cat,
    emoji: service.tag,
    shortDescription: service.desc.slice(0, 140),
    description: service.desc,
    price: service.price,
    durationMinutes: parseDuration(service.duration),
    rating: service.rating,
    reviewsCount: service.reviews,
    addons: service.addons.map(parseAddon),
    prep: service.prep,
    aftercare: service.aftercare,
    gender: service.gender,
    minAge: service.minAge,
    popularity: service.reviews,
    isFeatured: index < 6,
  })));

  const serviceByCode = new Map(createdServices.map(item => [item.code, item]));

  const createdStylists = await Stylist.insertMany(stylists.map(stylist => ({
    user: stylist.id === 'st1' ? stylistUser._id : undefined,
    code: stylist.id,
    name: stylist.name,
    role: stylist.role,
    bio: stylist.bio,
    rating: stylist.rating,
    jobs: stylist.jobs,
    skills: stylist.skills,
    portfolio: stylist.portfolio,
    serviceCodes: stylist.services,
    experienceYears: stylist.experience,
    priceRange: stylist.priceRange,
    available: stylist.available,
    availability: [
      { day: 'monday', startTime: '09:00', endTime: '18:00' },
      { day: 'tuesday', startTime: '09:00', endTime: '18:00' },
      { day: 'wednesday', startTime: '09:00', endTime: '18:00' },
      { day: 'thursday', startTime: '09:00', endTime: '18:00' },
      { day: 'friday', startTime: '09:00', endTime: '18:00' },
      { day: 'saturday', startTime: '09:00', endTime: '18:00' },
    ],
    offerings: stylist.services.map(code => {
      const service = serviceByCode.get(code);
      return { service: service._id, price: service.price, durationMinutes: service.durationMinutes, isActive: true };
    }),
    approvalStatus: 'approved',
  })));

  const stylistByName = new Map(createdStylists.map(item => [item.name.split(' ')[0].toLowerCase(), item]));

  await Branch.insertMany(branches.map(branch => ({
    code: branch.id,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    hours: branch.hours,
  })));

  await Offer.insertMany(offers.map(offer => ({
    code: offer.code,
    title: offer.title,
    description: offer.text,
    category: offer.cat,
    badge: offer.badge,
    priceText: offer.price,
    oldPriceText: offer.old,
    ...parseOfferDiscount(offer),
  })));

  await GalleryItem.insertMany(gallery.map(item => {
    const stylistKey = item.label.split('·')[1]?.trim().split(' ')[0].toLowerCase();
    return {
      title: item.label,
      category: item.cat,
      emoji: item.emoji,
      stylist: stylistByName.get(stylistKey)?._id,
    };
  }));

  await Review.insertMany(reviews.map(review => ({
    name: review.name,
    rating: review.rating,
    text: review.text,
    service: [...serviceByCode.values()].find(service => service.title === review.service)?._id,
    stylist: [...createdStylists].find(stylist => stylist.name === review.stylist)?._id,
    createdAt: new Date(),
  })));

  console.log('Seed complete');
  console.log(`Admin login email: ${admin.email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) console.log('Admin seed password used the default Admin123!. Change it before public launch.');
  console.log('Stylist login: stylist@glowbelle.com / Stylist123!');
  console.log('Customer login: customer@glowbelle.com / Customer123!');
  await mongoose.connection.close();
}

seed().catch(async error => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
