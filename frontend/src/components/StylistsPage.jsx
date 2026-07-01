import { BadgeCheck, Star, Briefcase, CalendarDays, Search, SlidersHorizontal, MapPin, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';
import StylistCard from './StylistCard.jsx';
import { assetUrl, glowbelleApi } from '../api.js';
import { activeStylistOfferings, stylistCanBook, stylistIsApproved, stylistPriceSummary, stylistRatingText, stylistServiceLabels } from '../stylistUtils.js';
import { money } from '../utils.js';

const DEFAULT_FILTERS = {
  q: '',
  specialty: 'all',
  location: '',
  rating: 'all',
  availableNow: false,
  homeService: false,
  maxPrice: 250000,
};

function isVideoMedia(item) {
  return item?.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(item?.imageUrl || '');
}

function normalizeLabels(items = []) {
  return items.map(item => typeof item === 'string' ? item : item.title || item.name || item.label).filter(Boolean);
}

function normalizeStylist(item) {
  const rawLocation = item.location || item.businessAddress || item.city;
  const location = typeof rawLocation === 'string'
    ? rawLocation
    : [rawLocation?.city, rawLocation?.state, rawLocation?.country].filter(Boolean).join(', ');
  const skills = normalizeLabels(item.skills || item.specialties || []);
  return {
    ...item,
    id: item.code || item.id || item._id,
    skills,
    portfolio: item.portfolio || [],
    portfolioItems: item.portfolioItems || [],
    experience: item.experienceYears ?? item.experience ?? 0,
    jobs: item.jobs || 0,
    rating: item.rating || 0,
    available: item.available !== false,
    location: location || '',
    priceRange: item.priceRange || '',
  };
}

function lowestStylistPrice(stylist) {
  const prices = activeStylistOfferings(stylist)
    .map(item => Number(item.customPrice ?? item.price ?? item.displayPrice ?? item.minPrice ?? 0))
    .filter(Boolean);
  if (Number(stylist.startingPrice || 0) > 0) prices.push(Number(stylist.startingPrice));
  return prices.length ? Math.min(...prices) : 0;
}

function stylistOffersHomeService(stylist) {
  const text = `${stylist.role || ''} ${stylist.specialty || ''} ${stylist.skills?.join(' ') || ''}`.toLowerCase();
  return Boolean(
    stylist.homeService ||
    stylist.isHomeService ||
    /home service|home appointment/.test(text) ||
    activeStylistOfferings(stylist).some(item => {
      const serviceText = `${item.title || item.name || ''} ${item.service?.title || item.service?.name || ''} ${item.category || item.categoryId || ''}`.toLowerCase();
      return /home-service|home service|home appointment/.test(serviceText);
    })
  );
}

export default function StylistsPage({ setPage, user }) {
  const isPublic = !user;
  const [selected, setSelected] = useState(null);
  const [stylists, setStylists] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const id = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await glowbelleApi.stylists({ available: true });
        const liveStylists = response.data || [];
        setStylists(liveStylists.map(normalizeStylist).filter(stylistIsApproved));
      } catch {
        setStylists([]);
        setLoadError('');
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [isPublic]);

  const specialtyOptions = [...new Set(stylists.flatMap(stylist => [
    stylist.specialty,
    stylist.role,
    ...stylistServiceLabels(stylist),
  ]).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  const filteredStylists = stylists.filter(stylist => {
    const services = stylistServiceLabels(stylist);
    const searchText = `${stylist.name || ''} ${stylist.role || ''} ${stylist.specialty || ''} ${stylist.location || ''} ${services.join(' ')}`.toLowerCase();
    const rating = Number(stylist.rating || 0);
    const price = lowestStylistPrice(stylist);
    return (
      searchText.includes(filters.q.toLowerCase()) &&
      (filters.specialty === 'all' || searchText.includes(filters.specialty.toLowerCase())) &&
      (!filters.location || String(stylist.location || '').toLowerCase().includes(filters.location.toLowerCase())) &&
      (filters.rating === 'all' || rating >= Number(filters.rating)) &&
      (!filters.availableNow || stylist.available !== false) &&
      (!filters.homeService || stylistOffersHomeService(stylist)) &&
      (!price || price <= filters.maxPrice)
    );
  });

  const serviceCount = stylists.reduce((sum, stylist) => sum + stylistServiceLabels(stylist).length, 0);
  const bookableCount = stylists.filter(stylist => stylistCanBook(stylist, false)).length;
  const activeFilterCount = [
    filters.q,
    filters.specialty !== 'all',
    filters.location,
    filters.rating !== 'all',
    filters.availableNow,
    filters.homeService,
    filters.maxPrice < 250000,
  ].filter(Boolean).length;

  function updateFilter(key, value) {
    setFilters(current => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <div className="stylists-page-shell">
      <div className="stylist-filter-toolbar">
        <button className="stylist-filter-toggle" onClick={() => setShowFilters(true)}>
          <SlidersHorizontal size={16} /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
        </button>
      </div>
      {showFilters && <button className="filter-drawer-backdrop" aria-label="Close filters" onClick={() => setShowFilters(false)} />}
      <section className={showFilters ? 'stylist-filter-panel open' : 'stylist-filter-panel'} aria-label="Stylist filters">
        <div className="filter-sidebar-head">
          <strong><SlidersHorizontal size={16} /> Filters</strong>
          <button onClick={() => setShowFilters(false)} aria-label="Close filters"><X size={16} /></button>
        </div>
        <label className="search-label">
          <Search size={18} />
          <input value={filters.q} onChange={event => updateFilter('q', event.target.value)} placeholder="Search name, specialty, or service..." />
        </label>
        <select value={filters.specialty} onChange={event => updateFilter('specialty', event.target.value)}>
          <option value="all">All specialties</option>
          {specialtyOptions.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <label className="stylist-location-filter">
          <MapPin size={16} />
          <input value={filters.location} onChange={event => updateFilter('location', event.target.value)} placeholder="Location..." />
        </label>
        <select value={filters.rating} onChange={event => updateFilter('rating', event.target.value)}>
          <option value="all">Any rating</option>
          <option value="4.5">4.5+ rating</option>
          <option value="4">4.0+ rating</option>
        </select>
        <label className="stylist-price-filter">
          Price up to {money(filters.maxPrice)}
          <input type="range" min="3000" max="250000" step="1000" value={filters.maxPrice} onChange={event => updateFilter('maxPrice', Number(event.target.value))} />
        </label>
        <label className="filter-check">
          <input type="checkbox" checked={filters.availableNow} onChange={event => updateFilter('availableNow', event.target.checked)} />
          Available now
        </label>
        <label className="filter-check">
          <input type="checkbox" checked={filters.homeService} onChange={event => updateFilter('homeService', event.target.checked)} />
          Home service
        </label>
        <div className="filter-actions">
          <button className="secondary" onClick={clearFilters}>Clear filters</button>
          <button onClick={() => setShowFilters(false)}>Apply filters</button>
        </div>
      </section>

      <section className="market-page-intro stylists-intro">
        <div className="intro-stats">
          <div><strong>{stylists.length || '0'}</strong><span>Approved professionals</span></div>
          <div><strong>{stylists.filter(item => item.available).length || '0'}</strong><span>Available now</span></div>
          <div><strong>{serviceCount || '0'}</strong><span>Services listed</span></div>
          <div><strong>{bookableCount || '0'}</strong><span>Direct Booking</span><small>Book your preferred professional</small></div>
        </div>
      </section>

      {loading && <div className="empty-state"><span>⌛</span><h3>Loading verified professionals</h3><p>Fetching approved stylist profiles from the backend.</p></div>}
      {!loading && loadError && <div className="empty-state"><span>⚠</span><h3>Professionals could not load</h3><p>{loadError}</p></div>}
      {!loading && !loadError && !stylists.length && <div className="empty-state"><span>✦</span><h3>No approved professionals yet</h3><p>GlowBelle is reviewing stylists. Approved professionals will appear here soon.</p><button onClick={() => setPage('services')}>Browse Services</button></div>}
      {!loading && !loadError && stylists.length > 0 && !filteredStylists.length && <div className="empty-state"><span>🔍</span><h3>No professionals found</h3><p>Try another specialty, location, rating, or price range.</p><button onClick={clearFilters}>Clear filters</button></div>}
      {!loading && !loadError && filteredStylists.length > 0 && <div className="market-stylist-grid stylists-market-grid">
        {filteredStylists.map(st => (
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
                  <span><Star size={14} /> {stylistRatingText(selected)}</span>
                  <span><Briefcase size={14} /> {selected.jobs} clients</span>
                  <span><CalendarDays size={14} /> {selected.experience} years exp.</span>
                </div>
                <p style={{ lineHeight: 1.6, margin: '12px 0' }}>{selected.bio}</p>
                {!isPublic && <p><strong>Pricing:</strong> {stylistPriceSummary(selected)}</p>}
                <div style={{ marginTop: 12 }}>
                  <strong>Services:</strong>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {stylistServiceLabels(selected).length
                      ? stylistServiceLabels(selected).map(s => <small key={s} style={{ background: 'var(--brand-light)', color: 'var(--brand)', padding: '3px 10px', borderRadius: 999, fontSize: 12 }}>{s}</small>)
                      : <small style={{ background: 'var(--brand-light)', color: 'var(--brand)', padding: '3px 10px', borderRadius: 999, fontSize: 12 }}>No services listed yet</small>}
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
                  {stylistCanBook(selected, isPublic) && <button onClick={() => { setSelected(null); setPage('booking', { stylistId: selected.id }); }}>Book Appointment</button>}
                  {!isPublic && !stylistCanBook(selected, isPublic) && <span className="market-service-preview-note">Services coming soon</span>}
                  {isPublic && <button onClick={() => { setSelected(null); setPage('login'); }}>Log in to book</button>}
                  <button className="secondary" onClick={() => setSelected(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
