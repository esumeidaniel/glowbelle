import { BadgeCheck, Star, Users, Briefcase, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';
import PageHero from './PageHero.jsx';
import StylistCard from './StylistCard.jsx';
import { assetUrl, glowbelleApi } from '../api.js';
import { stylistsOrFallback } from '../marketplace.js';

function isVideoMedia(item) {
  return item?.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(item?.imageUrl || '');
}

function normalizeStylist(item) {
  const rawLocation = item.location || item.businessAddress || item.city;
  const location = typeof rawLocation === 'string'
    ? rawLocation
    : [rawLocation?.city, rawLocation?.state, rawLocation?.country].filter(Boolean).join(', ');
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
    location: location || 'Location added after approval',
    priceRange: item.priceRange || (item.offerings?.length ? 'Prices listed per service' : 'Ask for pricing'),
  };
}

export default function StylistsPage({ setPage, user }) {
  const isPublic = !user;
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
        const liveStylists = response.data || [];
        setStylists((isPublic ? liveStylists : stylistsOrFallback(liveStylists)).map(normalizeStylist));
      } catch {
        setStylists(isPublic ? [] : stylistsOrFallback().map(normalizeStylist));
        setLoadError('');
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [isPublic]);

  return (
    <>
      <PageHero title="Our professionals" text="Meet our verified team of stylists, barbers, makeup artists and spa therapists." icon={<Users />} />
      <section className="market-page-intro stylists-intro">
        <div>
          <span className="eyebrow">Verified professional network</span>
          <h2>Compare work, availability and services before booking.</h2>
          <p>Browse verified beauty professionals by specialty, portfolio work and availability.</p>
        </div>
        <div className="intro-stats">
          <div><strong>{stylists.length || '0'}</strong><span>Approved profiles</span></div>
          <div><strong>{stylists.filter(item => item.available).length || '0'}</strong><span>Available now</span></div>
          <div><strong>Direct</strong><span>Book chosen stylist</span></div>
        </div>
      </section>
      {loading && <div className="empty-state"><span>⌛</span><h3>Loading verified professionals</h3><p>Fetching approved stylist profiles from the backend.</p></div>}
      {!loading && loadError && <div className="empty-state"><span>⚠</span><h3>Professionals could not load</h3><p>{loadError}</p></div>}
      {!loading && !loadError && !stylists.length && <div className="empty-state"><span>✦</span><h3>Professional stylists are joining GlowBelle soon.</h3><p>Approved stylist profiles will appear here after verification.</p><button onClick={() => setPage('stylist-apply')}>Join as a Stylist</button></div>}
      {!loading && !loadError && stylists.length > 0 && <div className="market-stylist-grid">
        {stylists.map(st => (
          <StylistCard key={st.id} stylist={st} setPage={setPage} onView={setSelected} previewOnly={isPublic} />
        ))}
      </div>}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card wide" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            <div className="stylist-modal">
              <div className="modal-profile-visual">
                <Avatar name={selected.name} src={selected.avatarUrl} size={96} />
                <span><BadgeCheck size={15} /> Verified professional</span>
              </div>
              <div className="stylist-modal-info">
                <h2>{selected.name}</h2>
                <p className="stylist-role">{selected.role}</p>
                <div className="stylist-stats">
                  <span><Star size={14} /> {selected.rating}</span>
                  <span><Briefcase size={14} /> {selected.jobs} clients</span>
                  <span><CalendarDays size={14} /> {selected.experience} years exp.</span>
                </div>
                <p style={{ lineHeight: 1.6, margin: '12px 0' }}>{selected.bio}</p>
                {!isPublic && <p><strong>Price range:</strong> {selected.priceRange}</p>}
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
                  {!isPublic && <button onClick={() => { setSelected(null); setPage('booking', { stylistId: selected.id }); }}>Book {selected.name.split(' ')[0]}</button>}
                  {isPublic && <button onClick={() => { setSelected(null); setPage('login'); }}>Log in to book</button>}
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
