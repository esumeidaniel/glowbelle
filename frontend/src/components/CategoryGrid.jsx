import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { assetUrl, glowbelleApi } from '../api.js';
import { categoriesOrFallback } from '../marketplace.js';

const CATEGORY_ACCENTS = {
  barbering: ['✂', 'Precision cuts'],
  braids: ['✦', 'Protective styles'],
  'hair-styling': ['◐', 'Salon finish'],
  'hair-coloring': ['◒', 'Colour work'],
  'natural-hair': ['◇', 'Natural care'],
  locs: ['◆', 'Loc care'],
  nails: ['○', 'Nail studio'],
  makeup: ['◌', 'Makeup artistry'],
  lashes: ['◍', 'Lash sets'],
  brows: ['◉', 'Brow shaping'],
  'spa-massage': ['◦', 'Spa care'],
  bridal: ['✧', 'Event ready'],
  'kids-services': ['△', 'Kids care'],
  'family-package': ['▣', 'Family booking'],
  'home-service': ['⌂', 'Home visits'],
  other: ['✺', 'More services'],
};

export default function CategoryGrid({ setPage }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await glowbelleApi.categories();
        setCategories(categoriesOrFallback(response.data || []));
      } catch {
        setCategories(categoriesOrFallback());
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
        const [icon, label] = CATEGORY_ACCENTS[id] || CATEGORY_ACCENTS.other;
        const imageUrl = category.coverImageUrl || category.imageUrl || category.displayImageUrl || '';
        return (
          <button className="category-card" key={id} onClick={() => setPage('services', { cat: id })}>
            {imageUrl
              ? <span className="category-media"><img src={assetUrl(imageUrl)} alt={category.title} /></span>
              : <span className="category-icon">{icon}</span>}
            <small>{label}</small>
            <h3>{category.title}</h3>
            <p>{category.description || 'Browse live services in this category.'}</p>
            {Number(category.activeServiceCount || 0) > 0 && <em>{category.activeServiceCount} bookable</em>}
            <span className="category-link">Explore <ChevronRight size={16} /></span>
          </button>
        );
      })}
    </div>
  );
}
