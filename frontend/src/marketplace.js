import { fallbackBookableServices, fallbackCategories, fallbackFeaturedServices, fallbackStylists } from './catalog.js';

function serviceKeys(service) {
  return new Set([service?._id, service?.id, service?.code].filter(Boolean).map(String));
}

export function offeringForService(stylist, service) {
  if (!stylist || !service) return null;
  const keys = serviceKeys(service);
  return (stylist.offerings || []).find(item => {
    const status = String(item.status || 'active').toLowerCase();
    const approval = String(item.approvalStatus || item.verificationStatus || 'approved').toLowerCase();
    if (
      item.isActive === false ||
      item.isAvailable === false ||
      item.available === false ||
      ['inactive', 'draft', 'disabled', 'pending', 'rejected', 'declined'].includes(status) ||
      ['pending', 'rejected', 'declined', 'inactive', 'draft'].includes(approval)
    ) return false;
    const linked = item.service;
    return (
      keys.has(String(linked?._id || linked)) ||
      keys.has(String(linked?.code)) ||
      keys.has(String(item.serviceId)) ||
      keys.has(String(item.catalogServiceId)) ||
      keys.has(String(item.serviceCode))
    );
  }) || null;
}

export function providerCountForService(service, stylists = []) {
  return stylists.filter(stylist => stylist.available !== false && offeringForService(stylist, service)).length;
}

export function primaryOfferingForService(service, stylists = []) {
  return stylists
    .filter(stylist => stylist.available !== false)
    .map(stylist => ({ stylist, offering: offeringForService(stylist, service) }))
    .filter(item => item.offering)
    .sort((a, b) => Number(a.offering.price || 0) - Number(b.offering.price || 0))[0] || null;
}

export function attachProviderCounts(services = [], stylists = []) {
  return services.map(service => {
    const primary = primaryOfferingForService(service, stylists);
    return {
      ...service,
      id: service.code || service.id || service._id,
      categoryId: service.categoryId || service.category,
      providerCount: providerCountForService(service, stylists),
      primaryOffering: primary?.offering,
      primaryStylist: primary?.stylist,
      displayImageUrl: primary?.offering?.imageUrl || service.imageUrl || '',
      displayPrice: primary?.offering?.price ?? service.price,
      displayDurationMinutes: primary?.offering?.durationMinutes ?? service.durationMinutes,
      displayDescription: primary?.offering?.description || service.shortDescription || service.description || '',
      stylistName: primary?.stylist?.name || '',
      location: primary?.stylist?.location || primary?.stylist?.business?.city || '',
      availableToday: primary?.stylist?.available !== false,
    };
  });
}

export function servicesOrFallback(items = [], options = {}) {
  const list = Array.isArray(items) && items.length ? items : (options.featured ? fallbackFeaturedServices() : fallbackBookableServices());
  return list.map(item => ({
    ...item,
    id: item.code || item.id || item._id,
    categoryId: item.categoryId || item.category,
    title: item.title || item.name,
    providerCount: item.providerCount ?? 0,
  }));
}

export function categoriesOrFallback(items = []) {
  if (Array.isArray(items) && items.length) {
    return items.map(item => ({
      ...item,
      id: item.slug || item.id || item._id,
      title: item.title || item.name,
      imageUrl: item.imageUrl || item.coverImageUrl,
      isPublished: item.isPublished !== false,
    }));
  }
  return fallbackCategories();
}

export function stylistsOrFallback(items = []) {
  if (Array.isArray(items) && items.length) return items;
  return fallbackStylists();
}
