import { Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import FilterSidebar from './FilterSidebar.jsx';
import SectionTitle from './SectionTitle.jsx';
import ServiceGrid from './ServiceGrid.jsx';
import { glowbelleApi } from '../api.js';
import { publicServicePreviews } from '../catalog.js';
import { categoriesOrFallback, servicesOrFallback } from '../marketplace.js';

export default function ServicesPage({ setPage, nav, user }) {
  const isPublic = !user;
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
        const rawServices = servicesResponse.data || [];
        const bookableServices = rawServices.length
          ? servicesOrFallback(rawServices).filter(item => item.providerCount > 0)
          : [];
        setItems(isPublic ? (bookableServices.length ? bookableServices : publicServicePreviews()) : (bookableServices.length ? bookableServices : servicesOrFallback().filter(item => item.providerCount > 0)));
        setCategories(categoriesOrFallback(categoriesResponse.data || []));
      } catch {
        setItems(isPublic ? publicServicePreviews() : servicesOrFallback().filter(item => item.providerCount > 0));
        setCategories(categoriesOrFallback());
        setLoadError('');
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [isPublic]);

  const hasBookableServices = items.some(item => Number(item.providerCount || 0) > 0);
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

  if (hasBookableServices && sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => (a.displayPrice ?? a.price) - (b.displayPrice ?? b.price));
  if (hasBookableServices && sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => (b.displayPrice ?? b.price) - (a.displayPrice ?? a.price));
  if (hasBookableServices && sortBy === 'rating') filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (hasBookableServices && sortBy === 'popular') filtered = [...filtered].sort((a, b) => (b.reviews || b.reviewsCount || 0) - (a.reviews || a.reviewsCount || 0));

  return (
    <>
      <section className="services-compact-head">
        <span className="eyebrow">Services</span>
        <h1>{isPublic && !hasBookableServices ? 'Explore GlowBelle services.' : 'Find a service and book a professional.'}</h1>
        <p>{isPublic && !hasBookableServices ? 'Preview beauty services while verified stylists join GlowBelle.' : 'Search, filter by category or price, then choose the service card you want.'}</p>
        <div className="services-quick-stats">
          <span>{items.length || 0} services</span>
          <span>{hasBookableServices ? `${items.filter(item => item.providerCount > 0).length} ready to book` : 'Preview mode'}</span>
          <span>{hasBookableServices ? 'Pay at salon' : 'Stylists coming soon'}</span>
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
        {hasBookableServices && (
          <>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="popular">Most popular</option>
              <option value="rating">Highest rated</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
            </select>
            <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={16} /> Filters
            </button>
          </>
        )}
      </div>

      {showFilters && hasBookableServices && (
        <FilterSidebar open={showFilters} onClose={() => setShowFilters(false)} categories={categories} filters={filters} setFilters={setFilters} />
      )}

      <SectionTitle
        title={hasBookableServices ? 'Available services' : 'Service previews'}
        text={hasBookableServices ? `${filtered.length} service${filtered.length !== 1 ? 's' : ''} found · ${filtered.filter(item => item.providerCount > 0).length} ready to book` : 'Images and skill names only. Prices appear after a stylist publishes an active service.'}
      />
      {loading && <div className="empty-state"><span>⌛</span><h3>Loading services</h3><p>Fetching current service previews and active bookable services.</p></div>}
      {!loading && loadError && <div className="empty-state"><span>⚠</span><h3>Services could not load</h3><p>{loadError}</p></div>}
      {!loading && !loadError && items.length > 0 && items.every(item => !item.providerCount) && (
        <div className="soft-launch-banner">
          <strong>Stylists are joining soon.</strong>
          <span>Booking opens when verified professionals are ready.</span>
        </div>
      )}
      {!loading && !loadError && filtered.length > 0 ? (
        <ServiceGrid items={filtered} setPage={setPage} />
      ) : !loading && !loadError && (
        <div className="empty-state">
          <span>🔍</span>
          <h3>No services found</h3>
          <p>{items.length ? 'Try adjusting your search or filters.' : 'Stylists are joining soon. Check back for bookable services.'}</p>
          <button onClick={() => { setQ(''); setFilters({ category: 'all', maxPrice: 250000, rating: 'all', duration: 'all', location: '', availableToday: false }); }}>Clear filters</button>
        </div>
      )}
    </>
  );
}
