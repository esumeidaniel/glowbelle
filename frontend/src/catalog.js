export const ADMIN_IMAGE_ASSETS = {
  hero: {
    marketplace: '/images/hero/beauty-marketplace-hero.png',
    braidsWigs: '/images/hero/braids-wigs-hero.png',
    beautyServices: '/images/categories/nails-makeup-lashes.png',
  },
  categories: {
    hairStyling: '/images/categories/hair-styling.png',
    braidsWigsNatural: '/images/categories/braids-wigs-natural.png',
    barbering: '/images/categories/barbering.png',
    nailsMakeupLashes: '/images/categories/nails-makeup-lashes.png',
    spaWellness: '/images/categories/spa-wellness.png',
    bridalHomeFamily: '/images/categories/bridal-home-family.png',
  },
  promos: {
    joinStylist: '/images/promos/join-stylist-banner.png',
  },
  gallery: {
    portfolioHighlight: '/images/gallery/portfolio-highlight.png',
  },
};

const CATEGORY_META = {
  'hair-styling': {
    title: 'Hair Styling',
    description: 'Wash, styling, silk press, treatments and salon finish services.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.hairStyling,
  },
  braids: {
    title: 'Braids',
    description: 'Protective braid styles from knotless braids to cornrows and twists.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
  },
  'wigs-extensions': {
    title: 'Wigs & Extensions',
    description: 'Installations, revamps, sew-ins and extension styling.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
  },
  'natural-hair': {
    title: 'Natural Hair',
    description: 'Natural hair care, locs, treatments and protective styling.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
  },
  barbering: {
    title: 'Barbering',
    description: 'Cuts, fades, beard grooming, shaves and line ups.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.barbering,
  },
  nails: {
    title: 'Nails',
    description: 'Manicure, pedicure, gel, acrylics, nail art and soak off.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
  },
  makeup: {
    title: 'Makeup',
    description: 'Soft glam, full glam, bridal makeup, shoots and gele styling.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
  },
  'lashes-brows': {
    title: 'Lashes & Brows',
    description: 'Lashes, brow shaping, tinting, threading and lift services.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
  },
  'spa-wellness': {
    title: 'Spa & Wellness',
    description: 'Facials, massage, waxing, scrubs, steam and skin consultation.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.spaWellness,
  },
  'bridal-events': {
    title: 'Bridal & Events',
    description: 'Wedding hair, makeup, event styling and group bookings.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
  },
  'childrens-salon': {
    title: "Children's Salon",
    description: 'Kids haircuts, braids, wash and style, and family packages.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
  },
  'home-service': {
    title: 'Home Service',
    description: 'Beauty professionals for home hair, makeup, nails and family visits.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
  },
};

const SERVICE_GROUPS = {
  'hair-styling': ['Wash & Blow Dry', 'Silk Press', 'Hair Treatment', 'Hair Coloring', 'Relaxer', 'Updo Styling', 'Ponytail Styling'],
  braids: ['Knotless Braids', 'Box Braids', 'Ghana Weaving', 'Cornrows', 'Crochet Braids', 'Twists', 'Fulani Braids'],
  'wigs-extensions': ['Wig Installation', 'Frontal Installation', 'Closure Installation', 'Wig Revamp', 'Sew-In Weave', 'Hair Extensions'],
  'natural-hair': ['Natural Hair Wash', 'Natural Hair Treatment', 'Twist Out', 'Loc Retwist', 'Dreadlocks Styling', 'Protective Styling'],
  barbering: ["Men's Haircut", 'Fade Cut', 'Beard Trim', 'Line Up', 'Shaving', 'Hair Dye', "Children's Barber Cut"],
  nails: ['Manicure', 'Pedicure', 'Gel Nails', 'Acrylic Nails', 'Nail Art', 'Nail Fixing', 'Soak Off'],
  makeup: ['Soft Glam Makeup', 'Full Glam Makeup', 'Bridal Makeup', 'Party Makeup', 'Photoshoot Makeup', 'Gele Tying'],
  'lashes-brows': ['Lash Extension', 'Lash Lift', 'Brow Shaping', 'Brow Tinting', 'Threading'],
  'spa-wellness': ['Facial Treatment', 'Massage', 'Body Scrub', 'Waxing', 'Steam Treatment', 'Skincare Consultation'],
  'bridal-events': ['Bridal Hair', 'Bridal Makeup', 'Bridesmaids Styling', 'Event Makeup', 'Group Booking', 'Traditional Wedding Styling'],
  'childrens-salon': ['Children Haircut', 'Children Braids', 'Children Natural Hair', 'Children Wash & Style', 'Family Hair Package'],
  'home-service': ['Home Hair Styling', 'Home Makeup', 'Home Nails', 'Home Barbering', 'Home Bridal Service', 'Family Home Appointment'],
};

const CATEGORY_RANGES = {
  'hair-styling': [8000, 45000, 60, 180],
  braids: [10000, 70000, 120, 360],
  'wigs-extensions': [12000, 85000, 90, 240],
  'natural-hair': [6000, 45000, 60, 180],
  barbering: [3000, 18000, 25, 75],
  nails: [4000, 35000, 45, 150],
  makeup: [12000, 80000, 60, 180],
  'lashes-brows': [3000, 45000, 25, 150],
  'spa-wellness': [8000, 65000, 45, 180],
  'bridal-events': [35000, 250000, 120, 420],
  'childrens-salon': [3000, 30000, 30, 150],
  'home-service': [15000, 150000, 90, 360],
};

const FEATURED_SERVICE_NAMES = new Set([
  'Silk Press',
  'Knotless Braids',
  'Fade Cut',
  'Acrylic Nails',
  'Soft Glam Makeup',
  'Bridal Makeup',
  'Facial Treatment',
  'Home Hair Styling',
]);

const SERVICE_OVERRIDES = {
  'Knotless Braids': {
    description: 'Neat protective braids with flexible styling options.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
  },
  'Silk Press': {
    description: 'Smooth salon silk press with wash, blow dry and sleek finish.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.hairStyling,
  },
  'Fade Cut': {
    description: 'Clean fade haircut with sharp line up and polished finish.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.barbering,
  },
  'Acrylic Nails': {
    description: 'Durable acrylic nail set with shape, polish and clean finishing.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
  },
  'Soft Glam Makeup': {
    description: 'Soft glam makeup for dates, parties, events and photos.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
  },
  'Facial Treatment': {
    description: 'Refreshing facial treatment for clean, hydrated and glowing skin.',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.spaWellness,
  },
};

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const MASTER_CATEGORIES = Object.entries(CATEGORY_META).map(([id, item], index) => ({
  id,
  slug: id,
  title: item.title,
  description: item.description,
  imageUrl: item.imageUrl,
  status: 'published',
  isPublished: true,
  sortOrder: index + 1,
  serviceCount: SERVICE_GROUPS[id]?.length || 0,
}));

export const MASTER_SERVICES = Object.entries(SERVICE_GROUPS).flatMap(([categoryId, names]) => {
  const [baseMin, baseMax, durationMin, durationMax] = CATEGORY_RANGES[categoryId];
  return names.map((name, index) => {
    const minPrice = baseMin + index * 750;
    const maxPrice = baseMax + index * 1500;
    const override = SERVICE_OVERRIDES[name] || {};
    const id = `${categoryId}-${slugify(name)}`;
    return {
      id,
      _id: id,
      code: id,
      category: categoryId,
      categoryId,
      categoryTitle: CATEGORY_META[categoryId].title,
      title: name,
      name,
      description: override.description || `${name} handled by a verified GlowBelle professional.`,
      shortDescription: override.description || `${name} handled by a verified GlowBelle professional.`,
      imageUrl: override.imageUrl || CATEGORY_META[categoryId].imageUrl,
      minPrice,
      maxPrice,
      price: minPrice,
      durationMin,
      durationMax,
      durationMinutes: durationMin,
      status: 'published',
      isActive: true,
      isPublished: true,
      isFeatured: FEATURED_SERVICE_NAMES.has(name),
      createdBy: 'admin',
      createdAt: '2026-06-30',
      stylistCount: 0,
    };
  });
});

export const PUBLIC_SERVICE_PREVIEWS = [
  ['barbering', 'Barbering', 'Sharp cuts, fades and beard grooming.', ADMIN_IMAGE_ASSETS.categories.barbering],
  ['braids', 'Braids', 'Protective styles, cornrows, twists and braids.', ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural],
  ['wigs-extensions', 'Wig Installation', 'Installs, revamps and extension styling.', ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural],
  ['nails', 'Nails', 'Manicure, pedicure, acrylics and nail art.', ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes],
  ['makeup', 'Makeup', 'Soft glam, bridal glam and event looks.', ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes],
  ['spa-wellness', 'Spa', 'Facials, massage and wellness treatments.', ADMIN_IMAGE_ASSETS.categories.spaWellness],
  ['childrens-salon', 'Children Hair', 'Kids haircuts, braids and family care.', ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily],
  ['bridal-events', 'Bridal Styling', 'Hair, makeup and styling for special days.', ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily],
  ['home-service', 'Home Service', 'Beauty appointments at home or events.', ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily],
].map(([categoryId, title, subtitle, imageUrl]) => ({
  id: `preview-${categoryId}`,
  _id: `preview-${categoryId}`,
  code: `preview-${categoryId}`,
  categoryId,
  category: categoryId,
  title,
  name: title,
  shortDescription: subtitle,
  description: subtitle,
  imageUrl,
  displayImageUrl: imageUrl,
  providerCount: 0,
  isPreview: true,
}));

export function publicServicePreviews() {
  return PUBLIC_SERVICE_PREVIEWS.map(item => ({ ...item }));
}

export const MOCK_STYLISTS = [
  {
    id: 'stylist-amaka',
    _id: 'stylist-amaka',
    name: 'Amaka Obi',
    role: 'Braids & bridal specialist',
    specialty: 'Knotless braids, bridal hair, wig installs',
    bio: 'Verified stylist focused on neat protective styling, bridal polish and clean finishing.',
    rating: 4.9,
    reviewsCount: 86,
    jobs: 312,
    location: 'Lekki Phase 1, Lagos',
    available: true,
    acceptingBookings: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
    skills: ['Braids', 'Bridal Hair', 'Wig Installation', 'Gele Tying'],
    portfolioItems: [
      { imageUrl: ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural, title: 'Medium knotless braids', status: 'approved' },
      { imageUrl: ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily, title: 'Bridal styling', status: 'approved' },
    ],
  },
  {
    id: 'stylist-tunde',
    _id: 'stylist-tunde',
    name: 'Tunde Adeyemi',
    role: 'Master barber',
    specialty: 'Fades, beard trims, line ups',
    bio: 'Precision barber with clean fades, beard sculpting and appointment-ready timing.',
    rating: 4.8,
    reviewsCount: 124,
    jobs: 621,
    location: 'Victoria Island, Lagos',
    available: true,
    acceptingBookings: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: ADMIN_IMAGE_ASSETS.categories.barbering,
    skills: ['Fade Cut', 'Beard Trim', 'Line Up'],
    portfolioItems: [
      { imageUrl: ADMIN_IMAGE_ASSETS.categories.barbering, title: 'Clean fade', status: 'approved' },
    ],
  },
  {
    id: 'stylist-nora',
    _id: 'stylist-nora',
    name: 'Nora James',
    role: 'Nail and beauty artist',
    specialty: 'Acrylic nails, gel nails, lash sets',
    bio: 'Nail artist creating durable sets, clean shaping and expressive nail art.',
    rating: 4.7,
    reviewsCount: 58,
    jobs: 208,
    location: 'Ikeja GRA, Lagos',
    available: true,
    acceptingBookings: true,
    avatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
    skills: ['Acrylic Nails', 'Gel Nails', 'Lash Extension'],
    portfolioItems: [
      { imageUrl: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes, title: 'Acrylic set', status: 'approved' },
    ],
  },
  {
    id: 'stylist-sarah',
    _id: 'stylist-sarah',
    name: 'Sarah Eze',
    role: 'Spa therapist',
    specialty: 'Facials, massage, skincare',
    bio: 'Calm spa therapist offering skin-focused facial care and wellness sessions.',
    rating: 4.8,
    reviewsCount: 74,
    jobs: 189,
    location: 'Ikoyi, Lagos',
    available: false,
    acceptingBookings: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    coverImageUrl: ADMIN_IMAGE_ASSETS.categories.spaWellness,
    skills: ['Facial Treatment', 'Massage', 'Body Scrub'],
    portfolioItems: [
      { imageUrl: ADMIN_IMAGE_ASSETS.categories.spaWellness, title: 'Glow facial setup', status: 'approved' },
    ],
  },
];

export const MOCK_STYLIST_SERVICES = [
  ['stylist-amaka', 'braids-knotless-braids', 25000, 240, 'Medium knotless braids with clean parting and flexible styling.', 'approved', true],
  ['stylist-amaka', 'braids-ghana-weaving', 16000, 150, 'Neat Ghana weaving for everyday and event looks.', 'approved', true],
  ['stylist-amaka', 'wigs-extensions-wig-installation', 30000, 150, 'Secure wig installation with natural finish.', 'approved', true],
  ['stylist-amaka', 'bridal-events-bridal-hair', 65000, 240, 'Bridal hair prep and event-ready finish.', 'approved', true],
  ['stylist-tunde', 'barbering-fade-cut', 7000, 45, 'Low, mid or high fade with line up.', 'approved', true],
  ['stylist-tunde', 'barbering-beard-trim', 4000, 30, 'Clean beard trim and shaping.', 'approved', true],
  ['stylist-tunde', 'barbering-line-up', 3000, 25, 'Sharp line up for a clean finish.', 'approved', true],
  ['stylist-nora', 'nails-acrylic-nails', 18000, 120, 'Acrylic nail set with polish and shape.', 'approved', true],
  ['stylist-nora', 'nails-gel-nails', 12000, 75, 'Glossy gel nails with clean cuticle care.', 'approved', true],
  ['stylist-nora', 'lashes-brows-lash-extension', 22000, 120, 'Soft lash extension set for everyday wear.', 'pending', true],
  ['stylist-sarah', 'spa-wellness-facial-treatment', 18000, 75, 'Glow facial with cleanse, steam, mask and hydration.', 'approved', true],
  ['stylist-sarah', 'spa-wellness-massage', 25000, 90, 'Relaxing full-body massage session.', 'approved', true],
].map(([stylistId, catalogServiceId, customPrice, customDuration, description, approvalStatus, isAvailable], index) => ({
  id: `stylist-service-${String(index + 1).padStart(3, '0')}`,
  stylistId,
  catalogServiceId,
  serviceId: catalogServiceId,
  customPrice,
  price: customPrice,
  customDuration,
  durationMinutes: customDuration,
  description,
  images: [],
  imageUrl: MASTER_SERVICES.find(service => service.id === catalogServiceId)?.imageUrl || '',
  status: isAvailable ? 'active' : 'inactive',
  approvalStatus,
  isActive: isAvailable,
  isAvailable,
}));

export const HERO_SLIDES = [
  {
    id: 1,
    title: 'Book trusted beauty professionals',
    subtitle: 'Find hairstylists, barbers, nail techs, makeup artists and spa professionals near you.',
    image: ADMIN_IMAGE_ASSETS.hero.marketplace,
    ctaText: 'Get Started',
    secondaryText: 'Join as a Stylist',
  },
  {
    id: 2,
    title: 'Beauty services for every occasion',
    subtitle: 'Explore braids, wigs, natural hair, bridal styling and home service.',
    image: ADMIN_IMAGE_ASSETS.hero.braidsWigs,
    ctaText: 'Explore Services',
    secondaryText: 'Join as a Stylist',
  },
  {
    id: 3,
    title: 'Barbering, nails, makeup and spa',
    subtitle: 'A cleaner way to discover trusted beauty professionals.',
    image: ADMIN_IMAGE_ASSETS.hero.beautyServices,
    ctaText: 'Get Started',
    secondaryText: 'Join as a Stylist',
  },
];

export function serviceById(id) {
  return MASTER_SERVICES.find(service => [service.id, service.code, service._id].includes(id));
}

export function categoryById(id) {
  return MASTER_CATEGORIES.find(category => category.id === id || category.slug === id);
}

export function approvedPublicImages(items = []) {
  return items.filter(item => (item.status || 'approved') === 'approved');
}

export function buildBookableServices(services = MASTER_SERVICES, stylists = MOCK_STYLISTS, stylistServices = MOCK_STYLIST_SERVICES) {
  return services
    .filter(service => (service.status || 'published') === 'published' && service.isActive !== false && service.isPublished !== false)
    .map(service => {
      const activeOfferings = stylistServices
        .filter(item => item.catalogServiceId === service.id || item.serviceId === service.id)
        .filter(item => item.status === 'active' && item.isActive !== false && item.approvalStatus === 'approved' && item.isAvailable !== false)
        .map(item => ({ offering: item, stylist: stylists.find(stylist => stylist.id === item.stylistId || stylist._id === item.stylistId) }))
        .filter(item => item.stylist && item.stylist.acceptingBookings !== false);
      const availableOfferings = activeOfferings.filter(item => item.stylist.available !== false);
      const primary = (availableOfferings[0] || activeOfferings[0]);
      return {
        ...service,
        title: service.title || service.name,
        providerCount: activeOfferings.length,
        activeProviderCount: availableOfferings.length,
        primaryOffering: primary?.offering,
        primaryStylist: primary?.stylist,
        displayImageUrl: primary?.offering?.imageUrl || service.imageUrl,
        displayPrice: primary?.offering?.customPrice ?? primary?.offering?.price ?? service.minPrice,
        displayDurationMinutes: primary?.offering?.customDuration ?? primary?.offering?.durationMinutes ?? service.durationMin,
        displayDescription: primary?.offering?.description || service.description,
        rating: primary?.stylist?.rating || 'New',
        reviews: primary?.stylist?.reviewsCount || 0,
        location: primary?.stylist?.location || 'Available after stylist approval',
        stylistName: primary?.stylist?.name || '',
        availableToday: Boolean(primary?.stylist?.available),
      };
    });
}

export function fallbackBookableServices() {
  return buildBookableServices().filter(service => service.providerCount > 0);
}

export function fallbackFeaturedServices() {
  return buildBookableServices()
    .filter(service => service.isFeatured && service.providerCount > 0)
    .slice(0, 8);
}

export function fallbackCategories() {
  return MASTER_CATEGORIES.map(category => ({
    ...category,
    serviceCount: MASTER_SERVICES.filter(service => service.categoryId === category.id).length,
    activeServiceCount: buildBookableServices().filter(service => service.categoryId === category.id && service.providerCount > 0).length,
  }));
}

export function fallbackStylists() {
  return MOCK_STYLISTS.map(stylist => ({
    ...stylist,
    offerings: MOCK_STYLIST_SERVICES.filter(item => item.stylistId === stylist.id),
    portfolioItems: approvedPublicImages(stylist.portfolioItems),
    startingPrice: Math.min(...MOCK_STYLIST_SERVICES.filter(item => item.stylistId === stylist.id && item.approvalStatus === 'approved').map(item => item.customPrice || item.price || 0).filter(Boolean)),
  }));
}
