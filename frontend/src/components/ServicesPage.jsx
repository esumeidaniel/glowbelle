import { Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import FilterSidebar from './FilterSidebar.jsx';
import ServiceGrid from './ServiceGrid.jsx';
import { glowbelleApi } from '../api.js';
import { publicServicePreviews } from '../catalog.js';
import { categoriesOrFallback, servicesOrFallback } from '../marketplace.js';

function defaultServiceFilters(category = 'all') {
  return {
    category,
    maxPrice: 250000,
    rating: 'all',
    duration: 'all',
    location: '',
    availableToday: false,
    homeService: false,
  };
}

export default function ServicesPage({ setPage, nav, user }) {
  const isPublic = !user;
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(defaultServiceFilters(nav?.cat || 'all'));
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
        setItems(isPublic ? (bookableServices.length ? bookableServices : publicServicePreviews()) : bookableServices);
        setCategories(categoriesOrFallback(categoriesResponse.data || []));
      } catch {
        setItems(isPublic ? publicServicePreviews() : []);
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
    const categoryId = s.cat || s.category || s.categoryId;
    const homeService = Boolean(s.homeService || s.isHomeService || categoryId === 'home-service' || /home service|home appointment/i.test(`${s.title || s.name} ${s.categoryTitle || ''} ${s.description || ''}`));
    return (
      (filters.category === 'all' || categoryId === filters.category) &&
      text.includes(q.toLowerCase()) &&
      price <= filters.maxPrice &&
      (filters.rating === 'all' || rating >= Number(filters.rating)) &&
      (filters.duration === 'all' || duration <= Number(filters.duration)) &&
      (!filters.location || String(s.location || '').toLowerCase().includes(filters.location.toLowerCase())) &&
      (!filters.availableToday || s.availableToday) &&
      (!filters.homeService || homeService)
    );
  });

  if (hasBookableServices && sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => (a.displayPrice ?? a.price) - (b.displayPrice ?? b.price));
  if (hasBookableServices && sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => (b.displayPrice ?? b.price) - (a.displayPrice ?? a.price));
  if (hasBookableServices && sortBy === 'rating') filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (hasBookableServices && sortBy === 'popular') filtered = [...filtered].sort((a, b) => (b.reviews || b.reviewsCount || 0) - (a.reviews || a.reviewsCount || 0));
  function clearFilters() {
    setQ('');
    setSortBy('popular');
    setFilters(defaultServiceFilters());
  }

  const activeFilterCount = [
    filters.category !== 'all',
    filters.maxPrice < 250000,
    filters.rating !== 'all',
    filters.duration !== 'all',
    Boolean(filters.location),
    filters.availableToday,
    filters.homeService,
  ].filter(Boolean).length;

  return (
    <div className="services-page-shell">
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
              <SlidersHorizontal size={16} /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </button>
          </>
        )}
      </div>

      {showFilters && hasBookableServices && <button className="filter-drawer-backdrop" aria-label="Close filters" onClick={() => setShowFilters(false)} />}
      {showFilters && hasBookableServices && (
        <FilterSidebar
          open={showFilters}
          onClose={() => setShowFilters(false)}
          onClear={clearFilters}
          categories={categories}
          filters={filters}
          setFilters={setFilters}
        />
      )}

      <div className="services-results-summary">
        {filtered.length} service{filtered.length !== 1 ? 's' : ''} found · {filtered.filter(item => item.providerCount > 0).length} ready to book
      </div>
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
          <p>{items.length ? 'Try another category, price range, or location.' : 'Stylists are joining soon. Check back for bookable services.'}</p>
          <button onClick={clearFilters}>Clear filters</button>
        </div>
      )}
    </div>
  );
}
