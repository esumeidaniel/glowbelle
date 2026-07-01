import { BadgeCheck, CalendarCheck, Clock, MapPin, Star, User } from 'lucide-react';
import { assetUrl } from '../api.js';
import { serviceCategoryLabel } from '../serviceCategories.js';
import { money } from '../utils.js';

export default function MarketplaceServiceCard({ service, setPage }) {
  const id = service.code || service.id || service._id;
  const categoryId = service.categoryId || service.category || service.cat;
  const bookable = Number(service.providerCount || 0) > 0;
  const duration = service.displayDurationMinutes || service.durationMinutes || service.durationMin || 60;
  const price = service.displayPrice ?? service.price ?? service.minPrice;
  const imageUrl = service.displayImageUrl || service.imageUrl;
  const stylistName = service.stylistName || service.primaryStylist?.name || (bookable ? 'Verified stylist' : '');
  const location = service.location || service.primaryStylist?.location || 'Lagos';
  const rating = service.rating || service.primaryStylist?.rating || 'New';

  return (
    <article className={bookable ? 'market-service-card' : 'market-service-card preview-only'}>
      <button className="market-service-media" onClick={() => setPage('service-detail', { serviceId: id, service })}>
        {imageUrl ? <img src={assetUrl(imageUrl)} alt={service.title || service.name} /> : <span>{service.emoji || '✦'}</span>}
        <em>{bookable ? 'Bookable' : 'Stylists coming soon'}</em>
      </button>
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
              <strong>From {money(price)}</strong>
              <div>
                <button className="secondary" onClick={() => setPage('stylists', { serviceId: id })}><BadgeCheck size={14} /> View Stylist</button>
                <button onClick={() => setPage('booking', { serviceId: id })}>Book Now</button>
              </div>
            </div>
          </>
        ) : (
          <div className="market-service-preview-note">Prices appear when a verified stylist offers this service.</div>
        )}
      </div>
    </article>
  );
}
