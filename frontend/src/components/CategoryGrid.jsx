import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { glowbelleApi } from '../api.js';

export default function CategoryGrid({ setPage }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await glowbelleApi.categories();
        setCategories(response.data || []);
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  if (loading) return <div className="empty-state"><span>⌛</span><h3>Loading categories</h3><p>Fetching live service categories.</p></div>;
  if (!categories.length) return <div className="empty-state"><span>✦</span><h3>Categories are being prepared</h3><p>Service categories will appear here as soon as they are published.</p></div>;

  return (
    <div className="grid six">
      {categories.map((category) => {
        const id = category.slug || category.id || category._id;
        return (
          <button className="category-card" key={id} onClick={() => setPage('services', { cat: id })}>
            <span style={{ fontSize: 28 }}>✦</span>
            <h3>{category.title}</h3>
            <p>{category.description || 'Browse live services in this category.'}</p>
            <ChevronRight size={18} />
          </button>
        );
      })}
    </div>
  );
}
