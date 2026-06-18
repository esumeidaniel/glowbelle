import { Scissors, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import PageHero from './PageHero.jsx';
import SectionTitle from './SectionTitle.jsx';
import ServiceGrid from './ServiceGrid.jsx';
import { glowbelleApi } from '../api.js';
import { attachProviderCounts } from '../marketplace.js';
import { SERVICE_CATEGORIES } from '../serviceCategories.js';
import { money } from '../utils.js';

export default function ServicesPage({ setPage, nav }) {
  const [cat, setCat] = useState(nav?.cat || 'all');
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [maxPrice, setMaxPrice] = useState(100000);
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const id = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [servicesResponse, categoriesResponse] = await Promise.all([
          glowbelleApi.services({ limit: 100 }),
          glowbelleApi.categories(),
        ]);
        const stylistsResponse = await glowbelleApi.stylists({ available: true }).catch(() => ({ data: [] }));
        setItems(attachProviderCounts(servicesResponse.data || [], stylistsResponse.data || []));
        const liveCategories = (categoriesResponse.data || []).map(category => ({
          id: category.slug || category.id || category._id,
          title: category.title,
        }));
        setCategories(liveCategories.length ? liveCategories : SERVICE_CATEGORIES.map(([id, title]) => ({ id, title })));
      } catch (err) {
        setItems([]);
        setCategories([]);
        setLoadError(err.message || 'Unable to load live services.');
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  let filtered = items.filter(s =>
    (cat === 'all' || (s.cat || s.category) === cat) &&
    s.title.toLowerCase().includes(q.toLowerCase()) &&
    s.price <= maxPrice
  );

  if (sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === 'rating') filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (sortBy === 'popular') filtered = [...filtered].sort((a, b) => (b.reviews || b.reviewsCount || 0) - (a.reviews || a.reviewsCount || 0));

  return (
    <>
      <PageHero title="Services for everyone" text="Women, men, children, bridal, spa and home-service bookings in one place." icon={<Scissors />} />
      
      <div className="toolbar">
        <label className="search-label">
          <Search size={18} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search braids, haircut, makeup, spa..." />
        </label>
        <select value={cat} onChange={e => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map(c => <option value={c.id} key={c.id}>{c.title}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="popular">Most popular</option>
          <option value="rating">Highest rated</option>
          <option value="price-asc">Price: Low to high</option>
          <option value="price-desc">Price: High to low</option>
        </select>
        <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="filter-bar">
          <div className="filter-group">
            <label>Max price: {money(maxPrice)}</label>
            <input type="range" min={4000} max={100000} step={1000} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} style={{ width: '100%' }} />
          </div>
          <div className="filter-group">
            <label>Category</label>
            <div className="cat-pills">
              <button className={cat === 'all' ? 'pill-btn active' : 'pill-btn'} onClick={() => setCat('all')}>All</button>
              {categories.map(c => <button key={c.id} className={cat === c.id ? 'pill-btn active' : 'pill-btn'} onClick={() => setCat(c.id)}>{c.title}</button>)}
            </div>
          </div>
        </div>
      )}

      <SectionTitle title="Available services" text={`${filtered.length} service${filtered.length !== 1 ? 's' : ''} found · ${filtered.filter(item => item.providerCount > 0).length} ready to book`} />
      {loading && <div className="empty-state"><span>⌛</span><h3>Loading live services</h3><p>Fetching the current service catalog from the backend.</p></div>}
      {!loading && loadError && <div className="empty-state"><span>⚠</span><h3>Services could not load</h3><p>{loadError}</p></div>}
      {!loading && !loadError && items.length > 0 && items.every(item => !item.providerCount) && (
        <div className="soft-launch-banner">
          <strong>Professionals are being onboarded.</strong>
          <span>You can browse the service catalog now. Booking opens as soon as approved stylists publish their prices, images and availability.</span>
        </div>
      )}
      {!loading && !loadError && filtered.length > 0 ? (
        <ServiceGrid items={filtered} setPage={setPage} />
      ) : !loading && !loadError && (
        <div className="empty-state">
          <span>🔍</span>
          <h3>No services found</h3>
          <p>{items.length ? 'Try adjusting your search or filters.' : 'Services will appear here as soon as admin publishes them.'}</p>
          <button onClick={() => { setQ(''); setCat('all'); setMaxPrice(100000); }}>Clear filters</button>
        </div>
      )}
    </>
  );
}
