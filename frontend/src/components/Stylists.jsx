import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';
import { glowbelleApi } from '../api.js';

function normalizeStylist(item) {
  const rawLocation = item.location || item.businessAddress || item.city;
  const location = typeof rawLocation === 'string'
    ? rawLocation
    : [rawLocation?.city, rawLocation?.state, rawLocation?.country].filter(Boolean).join(', ');
  return {
    ...item,
    id: item.code || item.id || item._id,
    skills: item.skills || [],
    rating: item.rating || 0,
    jobs: item.jobs || 0,
    available: item.available !== false,
    location: location || 'Location added after approval',
  };
}

export default function Stylists({ setPage, preview }) {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    const id = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await glowbelleApi.stylists({ available: true });
        setStylists((response.data || []).map(normalizeStylist));
      } catch (err) {
        setStylists([]);
        setLoadError(err.message || 'Unable to load verified professionals.');
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const shown = preview ? stylists.slice(0, 4) : stylists;
  if (loading) return <div className="empty-state"><span>⌛</span><h3>Loading verified professionals</h3><p>Fetching approved stylists from the backend.</p></div>;
  if (loadError) return <div className="empty-state"><span>⚠</span><h3>Professionals could not load</h3><p>{loadError}</p></div>;
  if (!shown.length) return <div className="empty-state"><span>✦</span><h3>No approved professionals yet</h3><p>Approved stylist profiles will appear here after admin verification.</p></div>;

  return (
    <div className="grid four">
      {shown.map(st => (
        <div className="stylist-card" key={st.id}>
          <div className="stylist-avatar-wrap">
            <Avatar name={st.name} src={st.avatarUrl} />
            <span><BadgeCheck size={13} /></span>
          </div>
          <h3>{st.name}</h3>
          <p>{st.role || 'Beauty professional'}</p>
          <span className="stylist-rating"><Star size={14} /> {st.rating || 'New'} · {st.jobs} clients</span>
          <div className="stylist-location"><MapPin size={13} /> {st.location}</div>
          <div className="stylist-skills">{st.skills.slice(0, 3).map(s => <small key={s}>{s}</small>)}</div>
          <div className={st.available ? 'avail-tag' : 'unavail-tag'}>{st.available ? 'Available for booking' : 'Unavailable today'}</div>
          <button onClick={() => setPage('booking', { stylistId: st.id })}>Book {st.name.split(' ')[0]}</button>
        </div>
      ))}
    </div>
  );
}
