import { Star, Users, Briefcase, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';
import PageHero from './PageHero.jsx';
import { assetUrl, glowbelleApi } from '../api.js';

function isVideoMedia(item) {
  return item?.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(item?.imageUrl || '');
}

function normalizeStylist(item) {
  return {
    ...item,
    id: item.code || item.id || item._id,
    skills: item.skills || [],
    portfolio: item.portfolio || [],
    portfolioItems: item.portfolioItems || [],
    experience: item.experienceYears ?? item.experience ?? 0,
    jobs: item.jobs || 0,
    rating: item.rating || 0,
    available: item.available !== false,
    priceRange: item.priceRange || (item.offerings?.length ? 'Prices listed per service' : 'Ask for pricing'),
  };
}

export default function StylistsPage({ setPage }) {
  const [selected, setSelected] = useState(null);
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

  return (
    <>
      <PageHero title="Our professionals" text="Meet our verified team of stylists, barbers, makeup artists and spa therapists." icon={<Users />} />
      {loading && <div className="empty-state"><span>⌛</span><h3>Loading verified professionals</h3><p>Fetching approved stylist profiles from the backend.</p></div>}
      {!loading && loadError && <div className="empty-state"><span>⚠</span><h3>Professionals could not load</h3><p>{loadError}</p></div>}
      {!loading && !loadError && !stylists.length && <div className="empty-state"><span>✦</span><h3>No approved professionals yet</h3><p>Approved stylist profiles will appear here after admin verification.</p></div>}
      {!loading && !loadError && stylists.length > 0 && <div className="grid four" style={{ paddingBottom: 48 }}>
        {stylists.map(st => (
          <div className="stylist-card" key={st.id} onClick={() => setSelected(st)}>
            <Avatar name={st.name} src={st.avatarUrl} size={72} />
            <h3>{st.name}</h3>
            <p>{st.role}</p>
            <span><Star size={14} /> {st.rating || 'New'} · {st.jobs} bookings</span>
            <div>{st.skills.map(s => <small key={s}>{s}</small>)}</div>
            {!st.available && <div className="unavail-tag">Unavailable today</div>}
            <button onClick={e => { e.stopPropagation(); setPage('booking', { stylistId: st.id }); }}>Book {st.name.split(' ')[0]}</button>
          </div>
        ))}
      </div>}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card wide" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            <div className="stylist-modal">
              <Avatar name={selected.name} src={selected.avatarUrl} size={88} />
              <div className="stylist-modal-info">
                <h2>{selected.name}</h2>
                <p className="stylist-role">{selected.role}</p>
                <div className="stylist-stats">
                  <span><Star size={14} /> {selected.rating}</span>
                  <span><Briefcase size={14} /> {selected.jobs} clients</span>
                  <span><CalendarDays size={14} /> {selected.experience} years exp.</span>
                </div>
                <p style={{ lineHeight: 1.6, margin: '12px 0' }}>{selected.bio}</p>
                <p><strong>Price range:</strong> {selected.priceRange}</p>
                <div style={{ marginTop: 12 }}>
                  <strong>Skills:</strong>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {selected.skills.map(s => <small key={s} style={{ background: 'var(--brand-light)', color: 'var(--brand)', padding: '3px 10px', borderRadius: 999, fontSize: 12 }}>{s}</small>)}
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <strong>Portfolio:</strong>
                  {selected.portfolioItems?.length > 0 ? (
                    <div className="stylist-portfolio-grid">
                      {selected.portfolioItems.map((item, index) => (
                        <div className="stylist-portfolio-card" key={`${item.imageUrl}-${index}`}>
                          {isVideoMedia(item)
                            ? <video src={assetUrl(item.imageUrl)} controls playsInline />
                            : <img src={assetUrl(item.imageUrl)} alt={item.title || 'Portfolio work'} />}
                          <span>{item.title || 'Portfolio work'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {selected.portfolio.length > 0
                        ? selected.portfolio.map(p => <span key={p} className="portfolio-chip">✨ {p}</span>)
                        : <span className="portfolio-chip">No portfolio uploads yet</span>}
                    </div>
                  )}
                </div>
                {!selected.available && <div className="note-box prep" style={{ marginTop: 12 }}>This stylist is not available today. You can still book for a future date.</div>}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button onClick={() => { setSelected(null); setPage('booking', { stylistId: selected.id }); }}>Book {selected.name.split(' ')[0]}</button>
                  <button className="secondary" onClick={() => setSelected(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
