import { Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import FilterSidebar from './FilterSidebar.jsx';
import SectionTitle from './SectionTitle.jsx';
import ServiceGrid from './ServiceGrid.jsx';
import { glowbelleApi } from '../api.js';
import { categoriesOrFallback, servicesOrFallback } from '../marketplace.js';

export default function ServicesPage({ setPage, nav }) {
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: nav?.cat || 'all',
    maxPrice: 250000,
    rating: 'all',
    duration: 'all',
    location: '',
    availableToday: false,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const id = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [servicesResponse, categoriesResponse] = await Promise.all([
          glowbelleApi.services({ limit: 100, bookableOnly: true }),
          glowbelleApi.categories(),
        ]);
        setItems(servicesOrFallback(servicesResponse.data || []).filter(item => item.providerCount > 0));
        setCategories(categoriesOrFallback(categoriesResponse.data || []));
      } catch {
        setItems(servicesOrFallback().filter(item => item.providerCount > 0));
        setCategories(categoriesOrFallback());
        setLoadError('');
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  let filtered = items.filter(s => {
    const text = `${s.title || s.name} ${s.stylistName || ''} ${s.categoryTitle || ''} ${s.location || ''}`.toLowerCase();
    const price = Number(s.displayPrice ?? s.price ?? s.minPrice ?? 0);
    const rating = Number(s.rating === 'New' ? 0 : s.rating || 0);
    const duration = Number(s.displayDurationMinutes || s.durationMinutes || s.durationMin || 0);
    return (
      (filters.category === 'all' || (s.cat || s.category || s.categoryId) === filters.category) &&
      text.includes(q.toLowerCase()) &&
      price <= filters.maxPrice &&
      (filters.rating === 'all' || rating >= Number(filters.rating)) &&
      (filters.duration === 'all' || duration <= Number(filters.duration)) &&
      (!filters.location || String(s.location || '').toLowerCase().includes(filters.location.toLowerCase())) &&
      (!filters.availableToday || s.availableToday)
    );
  });

  if (sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => (a.displayPrice ?? a.price) - (b.displayPrice ?? b.price));
  if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => (b.displayPrice ?? b.price) - (a.displayPrice ?? a.price));
  if (sortBy === 'rating') filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (sortBy === 'popular') filtered = [...filtered].sort((a, b) => (b.reviews || b.reviewsCount || 0) - (a.reviews || a.reviewsCount || 0));

  return (
    <>
      <section className="services-compact-head">
        <span className="eyebrow">Services</span>
        <h1>Find a service and book a professional.</h1>
        <p>Search, filter by category or price, then choose the service card you want.</p>
        <div className="services-quick-stats">
          <span>{items.length || 0} services</span>
          <span>{items.filter(item => item.providerCount > 0).length || 0} ready to book</span>
          <span>Pay at salon</span>
        </div>
      </section>
      
      <div className="toolbar">
        <label className="search-label">
          <Search size={18} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search braids, haircut, makeup, spa..." />
        </label>
        <select value={filters.category} onChange={e => setFilters(current => ({ ...current, category: e.target.value }))}>
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
        <FilterSidebar open={showFilters} onClose={() => setShowFilters(false)} categories={categories} filters={filters} setFilters={setFilters} />
      )}

      <SectionTitle title="Available services" text={`${filtered.length} service${filtered.length !== 1 ? 's' : ''} found · ${filtered.filter(item => item.providerCount > 0).length} ready to book`} />
      {loading && <div className="empty-state"><span>⌛</span><h3>Loading live services</h3><p>Fetching active stylist services and the admin catalog.</p></div>}
      {!loading && loadError && <div className="empty-state"><span>⚠</span><h3>Services could not load</h3><p>{loadError}</p></div>}
      {!loading && !loadError && items.length > 0 && items.every(item => !item.providerCount) && (
        <div className="soft-launch-banner">
          <strong>Professionals are being onboarded.</strong>
          <span>Booking opens as soon as approved stylists publish their prices, images and availability.</span>
        </div>
      )}
      {!loading && !loadError && filtered.length > 0 ? (
        <ServiceGrid items={filtered} setPage={setPage} />
      ) : !loading && !loadError && (
        <div className="empty-state">
          <span>🔍</span>
          <h3>No services found</h3>
          <p>{items.length ? 'Try adjusting your search or filters.' : 'No stylists available for this service yet.'}</p>
          <button onClick={() => { setQ(''); setFilters({ category: 'all', maxPrice: 250000, rating: 'all', duration: 'all', location: '', availableToday: false }); }}>Clear filters</button>
        </div>
      )}
    </>
  );
}
