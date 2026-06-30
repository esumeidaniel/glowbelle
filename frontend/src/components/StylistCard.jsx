import { BadgeCheck, CalendarCheck, MapPin, Star } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { assetUrl } from '../api.js';
import { money } from '../utils.js';

export default function StylistCard({ stylist, setPage, onView }) {
  const id = stylist.code || stylist.id || stylist._id;
  const firstName = String(stylist.name || 'Stylist').split(' ')[0];
  const startingPrice = stylist.startingPrice ? money(stylist.startingPrice) : stylist.priceRange || 'Prices by service';

  return (
    <article className="market-stylist-card">
      <button className="market-stylist-cover" onClick={() => onView?.(stylist)}>
        {stylist.coverImageUrl ? <img src={assetUrl(stylist.coverImageUrl)} alt="" /> : null}
      </button>
      <div className="market-stylist-body">
        <div className="market-stylist-avatar">
          <Avatar name={stylist.name} src={stylist.avatarUrl} size={76} />
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
          <strong>From {startingPrice}</strong>
          <button className="secondary" onClick={() => onView?.(stylist)}>View Profile</button>
          <button onClick={() => setPage('booking', { stylistId: id })}>Book {firstName}</button>
        </div>
      </div>
    </article>
  );
}
