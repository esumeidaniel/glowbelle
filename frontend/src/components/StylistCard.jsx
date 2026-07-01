import { BadgeCheck, CalendarCheck, MapPin, Star } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { assetUrl } from '../api.js';
import { ADMIN_IMAGE_ASSETS } from '../catalog.js';
import { stylistCanBook, stylistIsApproved, stylistPriceSummary, stylistRatingText, stylistServiceLabels } from '../stylistUtils.js';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80';

export default function StylistCard({ stylist, setPage, onView, previewOnly = false }) {
  const id = stylist.code || stylist.id || stylist._id;
  const coverImage = stylist.coverImageUrl
    || stylist.portfolioItems?.find(item => item.imageUrl)?.imageUrl
    || ADMIN_IMAGE_ASSETS.hero.beautyServices;
  const avatarImage = stylist.avatarUrl || stylist.profileImageUrl || stylist.photoUrl || FALLBACK_AVATAR;
  const approved = stylistIsApproved(stylist);
  const canBook = stylistCanBook(stylist, previewOnly);
  const serviceLabels = stylistServiceLabels(stylist);
  const location = stylist.location || 'Location not added yet';

  return (
    <article className="market-stylist-card">
      <button className="market-stylist-cover" onClick={() => onView?.(stylist)}>
        <img src={assetUrl(coverImage)} alt={`${stylist.name || 'Stylist'} portfolio preview`} loading="lazy" />
      </button>
      <div className="market-stylist-body">
        <div className="market-stylist-avatar">
          <Avatar name={stylist.name} src={avatarImage} size={76} />
          {approved && <span><BadgeCheck size={13} /> Verified</span>}
        </div>
        <h3>{stylist.name}</h3>
        <p>{stylist.specialty || stylist.role || 'Beauty professional'}</p>
        <div className="market-stylist-meta">
          <span><Star size={14} /> {stylistRatingText(stylist)}</span>
          <span><MapPin size={14} /> {location}</span>
          <span><CalendarCheck size={14} /> {stylist.available === false ? 'Next available soon' : 'Available now'}</span>
        </div>
        <div className="market-stylist-skills">
          {serviceLabels.length ? serviceLabels.slice(0, 4).map(skill => <small key={skill}>{skill}</small>) : <small>No services listed yet</small>}
        </div>
        <div className="market-stylist-actions">
          <strong>{previewOnly ? 'Profile preview' : stylistPriceSummary(stylist)}</strong>
          <button className="secondary" onClick={() => onView?.(stylist)}>View Profile</button>
          {canBook ? <button onClick={() => setPage('booking', { stylistId: id })}>Book Appointment</button> : !previewOnly && <em>Services coming soon</em>}
        </div>
      </div>
    </article>
  );
}
