import { money } from './utils.js';

export function stylistIsApproved(stylist = {}) {
  if (stylist.isApproved === false || stylist.approved === false) return false;
  const status = String(stylist.approvalStatus || stylist.verificationStatus || stylist.profileStatus || stylist.status || '').toLowerCase();
  if (!status) return true;
  return !['pending', 'rejected', 'declined', 'suspended', 'inactive', 'draft'].includes(status);
}

export function activeStylistOfferings(stylist = {}) {
  const offerings = stylist.offerings || stylist.services || stylist.stylistServices || [];
  return offerings.filter(item => {
    const status = String(item.status || 'active').toLowerCase();
    const approval = String(item.approvalStatus || item.verificationStatus || 'approved').toLowerCase();
    const active = item.isActive !== false && item.isAvailable !== false && item.available !== false && !['inactive', 'draft', 'disabled', 'pending', 'rejected', 'declined'].includes(status);
    const approved = !['pending', 'rejected', 'declined', 'inactive', 'draft'].includes(approval);
    return active && approved;
  });
}

export function stylistServiceLabels(stylist = {}) {
  const offeringLabels = activeStylistOfferings(stylist)
    .map(item => item.title || item.name || item.service?.title || item.service?.name || item.catalogService?.title || item.catalogService?.name)
    .filter(Boolean);
  const labels = offeringLabels.length ? offeringLabels : (stylist.skills || stylist.specialties || []);
  return [...new Set(labels.filter(Boolean))];
}

export function stylistPriceSummary(stylist = {}) {
  const prices = activeStylistOfferings(stylist)
    .map(item => Number(item.customPrice ?? item.price ?? item.displayPrice ?? item.minPrice ?? 0))
    .filter(Boolean);
  if (Number(stylist.startingPrice || 0) > 0) prices.push(Number(stylist.startingPrice));
  if (prices.length) return `From ${money(Math.min(...prices))}`;
  if (activeStylistOfferings(stylist).length || Number(stylist.activeServiceCount || stylist.activeOfferingsCount || 0) > 0) return 'View services for pricing';
  return 'Pricing not listed yet';
}

export function stylistCanBook(stylist = {}, previewOnly = false) {
  const hasActiveServices = activeStylistOfferings(stylist).length > 0 || Number(stylist.activeServiceCount || stylist.activeOfferingsCount || 0) > 0;
  return !previewOnly && stylistIsApproved(stylist) && stylist.available !== false && hasActiveServices;
}

export function stylistRatingText(stylist = {}) {
  const reviews = Number(stylist.reviewsCount || stylist.reviews || stylist.jobs || 0);
  const rating = Number(stylist.rating || 0);
  if (rating > 0 && reviews > 0) return `${rating.toFixed(rating % 1 ? 1 : 0)} (${reviews} review${reviews === 1 ? '' : 's'})`;
  if (rating > 0) return `${rating.toFixed(rating % 1 ? 1 : 0)} · No reviews yet`;
  return 'New professional';
}
