import { MASTER_CATEGORIES, MASTER_SERVICES } from './catalog.js';

export const SERVICE_CATEGORIES = MASTER_CATEGORIES.map(category => [category.id, category.title]);

export function serviceCategoryLabel(value) {
  return SERVICE_CATEGORIES.find(([id]) => id === value)?.[1] || value || 'Service';
}

export const SERVICE_SUGGESTIONS = MASTER_SERVICES
  .filter(service => service.isFeatured)
  .slice(0, 18)
  .map(service => ({
    id: service.id,
    code: service.code,
    title: service.title,
    category: service.categoryId,
    emoji: '✦',
    imageUrl: service.imageUrl,
    price: service.minPrice,
    minPrice: service.minPrice,
    maxPrice: service.maxPrice,
    durationMinutes: service.durationMin,
    shortDescription: service.shortDescription,
    description: service.description,
    isFeatured: service.isFeatured,
    isActive: true,
  }));
