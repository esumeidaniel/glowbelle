import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';
import { glowbelleApi } from '../api.js';

function normalizeStylist(item) {
  return {
    ...item,
    id: item.code || item.id || item._id,
    skills: item.skills || [],
    rating: item.rating || 0,
    jobs: item.jobs || 0,
    available: item.available !== false,
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
          <Avatar name={st.name} src={st.avatarUrl} />
          <h3>{st.name}</h3>
          <p>{st.role}</p>
          <span><Star size={14} /> {st.rating} · {st.jobs} clients</span>
          <div>{st.skills.slice(0, 3).map(s => <small key={s}>{s}</small>)}</div>
          {!st.available && <div className="unavail-tag" style={{ marginBottom: 8 }}>Unavailable today</div>}
          <button onClick={() => setPage('booking', { stylistId: st.id })}>Book {st.name.split(' ')[0]}</button>
        </div>
      ))}
    </div>
  );
}
