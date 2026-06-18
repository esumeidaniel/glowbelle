import { Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import PageHero from './PageHero.jsx';
import { assetUrl, glowbelleApi } from '../api.js';

const GALLERY_CATS = [
  { id: 'all', label: 'All' },
  { id: 'portfolio', label: 'Stylist Portfolio' },
  { id: 'women', label: "Women's Hair" },
  { id: 'men', label: "Men's Grooming" },
  { id: 'kids', label: 'Kids' },
  { id: 'bridal', label: 'Bridal' },
  { id: 'spa', label: 'Spa' },
];

function isVideoMedia(item) {
  return item?.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(item?.imageUrl || '');
}

export default function GalleryPage({ setPage }) {
  const [cat, setCat] = useState('all');
  const [selected, setSelected] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const id = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await glowbelleApi.gallery();
        setGallery((response.data || []).map(item => ({
          id: item._id || item.id,
          label: item.title,
          cat: item.category || 'all',
          emoji: item.emoji || '✦',
          imageUrl: item.imageUrl ? assetUrl(item.imageUrl) : '',
          mediaType: item.mediaType || 'image',
          stylist: item.stylist,
        })));
      } catch (err) {
        setGallery([]);
        setLoadError(err.message || 'Unable to load gallery.');
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const filtered = cat === 'all' ? gallery : gallery.filter(g => g.cat === cat);

  const GRAD = {
    women: 'linear-gradient(135deg, #f0abfc, #e879f9, #c026d3)',
    men: 'linear-gradient(135deg, #93c5fd, #60a5fa, #2563eb)',
    kids: 'linear-gradient(135deg, #6ee7b7, #34d399, #059669)',
    bridal: 'linear-gradient(135deg, #fda4af, #fb7185, #e11d48)',
    spa: 'linear-gradient(135deg, #fcd34d, #f59e0b, #d97706)',
    family: 'linear-gradient(135deg, #c4b5fd, #a78bfa, #7c3aed)',
  };

  return (
    <>
      <PageHero title="Gallery" text="Real transformations from our GlowBelle clients — hair, men, kids, bridal and spa." icon={<ImageIcon />} />

      <div className="gallery-filters">
        {GALLERY_CATS.map(c => (
          <button key={c.id} className={cat === c.id ? 'pill-btn active' : 'pill-btn'} onClick={() => setCat(c.id)}>{c.label}</button>
        ))}
      </div>

      {loading && <div className="empty-state"><span>⌛</span><h3>Loading gallery</h3><p>Fetching published gallery items from the backend.</p></div>}
      {!loading && loadError && <div className="empty-state"><span>⚠</span><h3>Gallery could not load</h3><p>{loadError}</p></div>}
      {!loading && !loadError && !filtered.length && <div className="empty-state"><span>✦</span><h3>No gallery items yet</h3><p>Stylist portfolio uploads, shop videos, and featured work will appear here.</p></div>}
      {!loading && !loadError && filtered.length > 0 && <div className="gallery-grid">
        {filtered.map(item => (
          <div className="gallery-item" key={item.id} style={{ background: item.imageUrl ? undefined : (GRAD[item.cat] || GRAD.women) }} onClick={() => setSelected(item)}>
            {item.imageUrl
              ? isVideoMedia(item)
                ? <video src={item.imageUrl} muted playsInline preload="metadata" />
                : <img src={item.imageUrl} alt={item.label || 'Gallery work'} />
              : <span className="gallery-emoji">{item.emoji}</span>}
            <div className="gallery-overlay">
              <span>{item.label}</span>
              {item.stylist?.name && <small>By {item.stylist.name}</small>}
              <button onClick={e => { e.stopPropagation(); setPage('booking'); }}>Book this look</button>
            </div>
          </div>
        ))}
      </div>}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card gallery-modal-card" onClick={e => e.stopPropagation()}>
            {selected.imageUrl
              ? isVideoMedia(selected)
                ? <video className="gallery-modal-media" src={selected.imageUrl} controls playsInline />
                : <img className="gallery-modal-media" src={selected.imageUrl} alt={selected.label || 'Gallery work'} />
              : <div className="gallery-modal-fallback" style={{ background: GRAD[selected.cat] }}>{selected.emoji}</div>}
            <h2>{selected.label}</h2>
            {selected.stylist?.name && <p>Uploaded by {selected.stylist.name}</p>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button onClick={() => { setSelected(null); setPage('booking'); }}>Book this look</button>
              <button className="secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
