import { SlidersHorizontal, X } from 'lucide-react';
import { money } from '../utils.js';

export default function FilterSidebar({ open, onClose, categories, filters, setFilters }) {
  function update(key, value) {
    setFilters(current => ({ ...current, [key]: value }));
  }

  return (
    <aside className={open ? 'filter-sidebar open' : 'filter-sidebar'}>
      <div className="filter-sidebar-head">
        <strong><SlidersHorizontal size={16} /> Filters</strong>
        <button onClick={onClose} aria-label="Close filters"><X size={16} /></button>
      </div>
      <label>
        Category
        <select value={filters.category} onChange={event => update('category', event.target.value)}>
          <option value="all">All categories</option>
          {categories.map(category => <option key={category.id} value={category.id}>{category.title}</option>)}
        </select>
      </label>
      <label>
        Max price: {money(filters.maxPrice)}
        <input type="range" min="3000" max="250000" step="1000" value={filters.maxPrice} onChange={event => update('maxPrice', Number(event.target.value))} />
      </label>
      <label>
        Minimum rating
        <select value={filters.rating} onChange={event => update('rating', event.target.value)}>
          <option value="all">Any rating</option>
          <option value="4.5">4.5+</option>
          <option value="4">4.0+</option>
        </select>
      </label>
      <label>
        Duration
        <select value={filters.duration} onChange={event => update('duration', event.target.value)}>
          <option value="all">Any duration</option>
          <option value="60">Under 1 hour</option>
          <option value="120">Under 2 hours</option>
          <option value="240">Under 4 hours</option>
        </select>
      </label>
      <label>
        Location
        <input value={filters.location} onChange={event => update('location', event.target.value)} placeholder="Lekki, VI, Ikeja..." />
      </label>
      <label className="filter-check">
        <input type="checkbox" checked={filters.availableToday} onChange={event => update('availableToday', event.target.checked)} />
        Available today
      </label>
    </aside>
  );
}
