import { BadgeCheck, CalendarCheck, Clock, MapPin, Star, User } from 'lucide-react';
import { assetUrl } from '../api.js';
import { ADMIN_IMAGE_ASSETS } from '../catalog.js';
import { serviceCategoryLabel } from '../serviceCategories.js';
import { money } from '../utils.js';

const SERVICE_IMAGE_FALLBACKS = {
  barbering: ADMIN_IMAGE_ASSETS.categories.barbering,
  braids: ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
  'wigs-extensions': ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
  'natural-hair': ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
  nails: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
  makeup: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
  'lashes-brows': ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
  'spa-wellness': ADMIN_IMAGE_ASSETS.categories.spaWellness,
  'bridal-events': ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
  'childrens-salon': ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
  'home-service': ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
};

const SERVICE_IMAGE_BY_NAME = {
  'fade cut': 'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&w=900&q=80',
  'beard trim': 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=80',
  'line up': 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=80',
  'knotless braids': 'https://images.unsplash.com/photo-1595425964076-2c1ec25b152f?auto=format&fit=crop&w=900&q=80',
  'ghana weaving': 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=900&q=80',
  'wig installation': 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=80',
  'bridal hair': 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  'facial treatment': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80',
  massage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80',
  'gel nails': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80',
  'acrylic nails': 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=900&q=80',
  'kids haircut': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80',
  'children haircut': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80',
};

function serviceImage(service, categoryId) {
  const title = String(service.title || service.name || '').toLowerCase();
  return service.approvedImageUrl ||
    service.stylistApprovedImageUrl ||
    service.adminImageUrl ||
    service.displayImageUrl ||
    SERVICE_IMAGE_BY_NAME[title] ||
    service.imageUrl ||
    SERVICE_IMAGE_FALLBACKS[categoryId] ||
    ADMIN_IMAGE_ASSETS.hero.beautyServices;
}

function statusBadge(service, bookable, categoryId) {
  if (!bookable) return 'Coming soon';
  if (service.availableToday) return 'Available today';
  if (service.homeService || service.isHomeService || categoryId === 'home-service') return 'Home service';
  if (service.availableToday === false) return 'Future bookings';
  if (Number(service.reviews || service.reviewsCount || 0) >= 50) return 'Popular';
  if (service.rating === 'New') return 'New';
  return '';
}

export default function MarketplaceServiceCard({ service, setPage }) {
  const id = service.code || service.id || service._id;
  const categoryId = service.categoryId || service.category || service.cat;
  const bookable = Number(service.providerCount || 0) > 0;
  const duration = service.displayDurationMinutes || service.durationMinutes || service.durationMin || 60;
  const price = service.displayPrice ?? service.price ?? service.minPrice;
  const imageUrl = serviceImage(service, categoryId);
  const stylistName = service.stylistName || service.primaryStylist?.name || (bookable ? 'Verified stylist' : '');
  const location = service.location || service.primaryStylist?.location || 'Lagos';
  const rating = service.rating || service.primaryStylist?.rating || 'New';
  const badge = statusBadge(service, bookable, categoryId);
  const genericFallback = assetUrl(ADMIN_IMAGE_ASSETS.hero.beautyServices);
  const imageProps = {
    src: assetUrl(imageUrl),
    alt: service.title || service.name,
    loading: 'lazy',
    onError: event => {
      if (event.currentTarget.src !== genericFallback) event.currentTarget.src = genericFallback;
    },
  };

  return (
    <article className={bookable ? 'market-service-card' : 'market-service-card preview-only'}>
      {bookable ? (
        <button className="market-service-media" onClick={() => setPage('service-detail', { serviceId: id, service })}>
          <img {...imageProps} />
          {badge && <em className="market-service-badge">{badge}</em>}
        </button>
      ) : (
        <div className="market-service-media" aria-label={`${service.title || service.name} preview`}>
          <img {...imageProps} />
          <em className="market-service-badge">Coming soon</em>
        </div>
      )}
      <div className="market-service-body">
        <div className="market-service-heading">
          <div>
            <small>{service.categoryTitle || serviceCategoryLabel(categoryId)}</small>
            <h3>{service.title || service.name}</h3>
          </div>
          {bookable && <span><Star size={14} /> {rating}</span>}
        </div>
        <p>{(service.displayDescription || service.shortDescription || service.description || 'Verified GlowBelle service.').slice(0, 112)}</p>
        {bookable ? (
          <>
            <div className="market-service-facts">
              <span><User size={13} /> {stylistName || 'Verified stylist'}</span>
              <span><Clock size={13} /> {duration} min</span>
              <span><MapPin size={13} /> {location}</span>
              <span><CalendarCheck size={13} /> {service.availableToday ? 'Available today' : 'Future bookings'}</span>
            </div>
            <div className="market-service-bottom">
              <strong>{price ? `From ${money(price)}` : 'View services for pricing'}</strong>
              <div className="market-service-actions">
                <button className="secondary" onClick={() => setPage('stylists', { serviceId: id })}><BadgeCheck size={14} /> View Stylist</button>
                <button onClick={() => setPage('booking', { serviceId: id })}>Book Now</button>
              </div>
            </div>
          </>
        ) : (
          <div className="market-service-preview-note">Pricing not listed yet</div>
        )}
      </div>
    </article>
  );
}
