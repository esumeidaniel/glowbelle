import { BadgeCheck, Clock, Star } from 'lucide-react';
import { assetUrl } from '../api.js';
import { serviceCategoryLabel } from '../serviceCategories.js';
import { money } from '../utils.js';

export default function ServiceGrid({ items, setPage }) {
  return (
    <div className="grid services">
      {items.map((raw) => {
        const service = {
          ...raw,
          id: raw.code || raw.id || raw._id,
          cat: raw.cat || raw.category,
          tag: raw.tag || raw.emoji || '',
          imageUrl: raw.displayImageUrl || raw.imageUrl || '',
          duration: raw.duration || `${raw.displayDurationMinutes || raw.durationMinutes || 60} min`,
          desc: raw.displayDescription || raw.desc || raw.shortDescription || raw.description || '',
          rating: raw.rating || 'New',
          providerCount: raw.providerCount || 0,
          price: raw.displayPrice ?? raw.price,
        };
        const bookable = service.providerCount > 0;
        return <article className="service-card" key={service.id} onClick={() => setPage('service-detail', { serviceId: service.id })}>
          <div className={`service-art ${service.cat || ''}`}>
            {service.imageUrl ? <img src={assetUrl(service.imageUrl)} alt={service.title} /> : <span>{service.tag}</span>}
            <div className="service-art-overlay">
              <span>{bookable ? 'Available now' : 'Coming soon'}</span>
              <strong>{bookable ? `${service.providerCount} pro${service.providerCount === 1 ? '' : 's'}` : 'No pro yet'}</strong>
            </div>
          </div>
          <div className="service-body">
            <div className="between">
              <h3>{service.title}</h3>
              <span className="rating"><Star size={14} />{service.rating}</span>
            </div>
            <p className="service-meta"><BadgeCheck size={13} /> {service.categoryTitle || serviceCategoryLabel(service.cat)} <span>·</span> <Clock size={13} /> {service.duration}</p>
            <p className="service-desc">{service.desc?.slice(0, 88)}{service.desc?.length > 88 ? '…' : ''}</p>
            <div className="between">
              <strong>{bookable ? `From ${money(service.price)}` : 'Opening soon'}</strong>
              <button className={!bookable ? 'soon-btn' : ''} onClick={e => { e.stopPropagation(); if (bookable) setPage('booking', { serviceId: service.id }); else setPage('service-detail', { serviceId: service.id }); }}>{bookable ? 'Book' : 'View'}</button>
            </div>
            <small className={bookable ? 'provider-status' : 'provider-status pending'}>{bookable ? `${service.providerCount} professional${service.providerCount === 1 ? '' : 's'} available` : 'Waiting for verified professionals'}</small>
          </div>
        </article>;
      })}
    </div>
  );
}
