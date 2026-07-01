import { BadgeCheck, CalendarCheck, MapPin, Star } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { assetUrl } from '../api.js';
import { ADMIN_IMAGE_ASSETS } from '../catalog.js';
import { money } from '../utils.js';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80';

export default function StylistCard({ stylist, setPage, onView, previewOnly = false }) {
  const id = stylist.code || stylist.id || stylist._id;
  const coverImage = stylist.coverImageUrl
    || stylist.portfolioItems?.find(item => item.imageUrl)?.imageUrl
    || ADMIN_IMAGE_ASSETS.hero.beautyServices;
  const avatarImage = stylist.avatarUrl || stylist.profileImageUrl || stylist.photoUrl || FALLBACK_AVATAR;
  const startingPrice = Number(stylist.startingPrice || 0) > 0
    ? `From ${money(stylist.startingPrice)}`
    : stylist.priceRange && !/prices by service/i.test(stylist.priceRange)
      ? stylist.priceRange
      : 'Prices vary by service';

  return (
    <article className="market-stylist-card">
      <button className="market-stylist-cover" onClick={() => onView?.(stylist)}>
        <img src={assetUrl(coverImage)} alt={`${stylist.name || 'Stylist'} portfolio preview`} loading="lazy" />
      </button>
      <div className="market-stylist-body">
        <div className="market-stylist-avatar">
          <Avatar name={stylist.name} src={avatarImage} size={76} />
          <span><BadgeCheck size={13} /> Verified</span>
        </div>
        <h3>{stylist.name}</h3>
        <p>{stylist.specialty || stylist.role || 'Beauty professional'}</p>
        <div className="market-stylist-meta">
          <span><Star size={14} /> {stylist.rating || 'New'} ({stylist.reviewsCount || stylist.jobs || 0})</span>
          <span><MapPin size={14} /> {stylist.location || 'Lagos'}</span>
          <span><CalendarCheck size={14} /> {stylist.available === false ? 'Next available soon' : 'Available now'}</span>
        </div>
        <div className="market-stylist-skills">
          {(stylist.skills || []).slice(0, 4).map(skill => <small key={skill}>{skill}</small>)}
        </div>
        <div className="market-stylist-actions">
          <strong>{previewOnly ? 'Profile preview' : startingPrice}</strong>
          <button className="secondary" onClick={() => onView?.(stylist)}>View Profile</button>
          {!previewOnly && <button onClick={() => setPage('booking', { stylistId: id })}>Book Appointment</button>}
        </div>
      </div>
    </article>
  );
}
