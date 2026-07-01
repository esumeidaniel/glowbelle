import { ArrowRight, CalendarDays, Image as ImageIcon, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { assetUrl, glowbelleApi } from '../api.js';
import { ADMIN_IMAGE_ASSETS, MOCK_STYLISTS } from '../catalog.js';

const GALLERY_CATS = [
  { id: 'all', label: 'All' },
  { id: 'portfolio', label: 'Stylist Portfolio' },
  { id: 'women', label: "Women's Hair" },
  { id: 'men', label: "Men's Grooming" },
  { id: 'kids', label: 'Kids' },
  { id: 'bridal', label: 'Bridal' },
  { id: 'spa', label: 'Spa' },
  { id: 'braids', label: 'Braids' },
  { id: 'nails', label: 'Nails' },
  { id: 'makeup', label: 'Makeup' },
  { id: 'wigs', label: 'Wigs' },
  { id: 'before-after', label: 'Before & After' },
  { id: 'home-service', label: 'Home Service' },
];

const CATEGORY_LABELS = Object.fromEntries(GALLERY_CATS.map(item => [item.id, item.label]));

const CATEGORY_ALIASES = {
  'stylist portfolio': 'portfolio',
  portfolio: 'portfolio',
  women: 'women',
  "women's hair": 'women',
  'womens hair': 'women',
  hair: 'women',
  'hair styling': 'women',
  'hair-styling': 'women',
  men: 'men',
  "men's grooming": 'men',
  'mens grooming': 'men',
  barbering: 'men',
  kids: 'kids',
  children: 'kids',
  'children hair': 'kids',
  'childrens-salon': 'kids',
  bridal: 'bridal',
  'bridal-events': 'bridal',
  spa: 'spa',
  'spa-wellness': 'spa',
  braids: 'braids',
  nails: 'nails',
  makeup: 'makeup',
  wigs: 'wigs',
  'wigs-extensions': 'wigs',
  'before after': 'before-after',
  'before & after': 'before-after',
  'before-and-after': 'before-after',
  'home service': 'home-service',
  'home-service': 'home-service',
};

const APPROVED_GALLERY_FALLBACK = [
  {
    id: 'approved-gallery-001',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
    title: 'Medium Knotless Braids',
    caption: 'Clean parting and lightweight protective styling approved for the marketplace gallery.',
    category: 'Braids',
    categories: ['portfolio', 'women', 'braids'],
    stylistId: 'stylist-amaka',
    stylistName: 'Amaka Obi',
    serviceId: 'braids-knotless-braids',
    serviceName: 'Knotless Braids',
    status: 'approved',
    uploadedAt: '2026-07-01',
  },
  {
    id: 'approved-gallery-002',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
    title: 'Bridal Styling Finish',
    caption: 'Event-ready bridal hair and soft glam detail from an approved professional.',
    category: 'Bridal',
    categories: ['portfolio', 'bridal', 'makeup', 'home-service'],
    stylistId: 'stylist-amaka',
    stylistName: 'Amaka Obi',
    serviceId: 'bridal-events-bridal-hair',
    serviceName: 'Bridal Hair',
    status: 'approved',
    uploadedAt: '2026-06-28',
  },
  {
    id: 'approved-gallery-003',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.barbering,
    title: 'Clean Fade',
    caption: 'Sharp fade and line-up result from a verified barber profile.',
    category: "Men's Grooming",
    categories: ['portfolio', 'men', 'before-after'],
    stylistId: 'stylist-tunde',
    stylistName: 'Tunde Adeyemi',
    serviceId: 'barbering-fade-cut',
    serviceName: 'Fade Cut',
    status: 'approved',
    uploadedAt: '2026-06-25',
  },
  {
    id: 'approved-gallery-004',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
    title: 'Acrylic Nail Set',
    caption: 'Glossy acrylic set with neat shaping and clean cuticle work.',
    category: 'Nails',
    categories: ['portfolio', 'nails'],
    stylistId: 'stylist-nora',
    stylistName: 'Nora James',
    serviceId: 'nails-acrylic-nails',
    serviceName: 'Acrylic Nails',
    status: 'approved',
    uploadedAt: '2026-06-21',
  },
  {
    id: 'approved-gallery-005',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.spaWellness,
    title: 'Glow Facial Setup',
    caption: 'Calm treatment room prepared for a facial and skin hydration session.',
    category: 'Spa',
    categories: ['portfolio', 'spa'],
    stylistId: 'stylist-sarah',
    stylistName: 'Sarah Eze',
    serviceId: 'spa-wellness-facial-treatment',
    serviceName: 'Facial Treatment',
    status: 'approved',
    uploadedAt: '2026-06-19',
  },
  {
    id: 'approved-gallery-006',
    imageUrl: ADMIN_IMAGE_ASSETS.gallery.portfolioHighlight,
    title: 'Wig Install Finish',
    caption: 'Natural finish wig installation with clean styling and salon-ready polish.',
    category: 'Wigs',
    categories: ['portfolio', 'women', 'wigs', 'before-after'],
    stylistId: 'stylist-amaka',
    stylistName: 'Amaka Obi',
    serviceId: 'wigs-extensions-wig-installation',
    serviceName: 'Wig Installation',
    status: 'approved',
    uploadedAt: '2026-06-15',
  },
  {
    id: 'approved-gallery-007',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
    title: 'Kids Braids',
    caption: 'Family-friendly kids braid styling with gentle sectioning.',
    category: 'Kids',
    categories: ['portfolio', 'kids', 'braids', 'home-service'],
    stylistId: '',
    stylistName: '',
    serviceId: 'childrens-salon-children-braids',
    serviceName: 'Children Braids',
    status: 'approved',
    uploadedAt: '2026-06-12',
  },
  {
    id: 'approved-gallery-008',
    imageUrl: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
    title: 'Soft Glam Makeup',
    caption: 'Soft glam beauty finish for appointments, events and photoshoots.',
    category: 'Makeup',
    categories: ['portfolio', 'makeup', 'bridal'],
    stylistId: '',
    stylistName: '',
    serviceId: 'makeup-soft-glam-makeup',
    serviceName: 'Soft Glam Makeup',
    status: 'approved',
    uploadedAt: '2026-06-10',
  },
];

function slug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function readableCategory(value) {
  const normalized = normalizeCategory(value);
  return CATEGORY_LABELS[normalized] || String(value || 'Portfolio');
}

function normalizeCategory(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'portfolio';
  return CATEGORY_ALIASES[raw] || CATEGORY_ALIASES[slug(raw)] || slug(raw);
}

function isVideoMedia(item) {
  return item?.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(item?.imageUrl || '');
}

function isApprovedGalleryItem(item) {
  const status = String(item.status || item.approvalStatus || 'approved').toLowerCase();
  return !['draft', 'pending', 'rejected', 'declined', 'hidden', 'inactive', 'demo', 'preview'].includes(status);
}

function uniqueCategories(item) {
  const values = [
    item.category,
    item.categoryId,
    item.type,
    item.service?.category,
    item.service?.categoryId,
    ...(Array.isArray(item.categories) ? item.categories : []),
    ...(Array.isArray(item.tags) ? item.tags : []),
  ].filter(Boolean);
  const normalized = values.map(normalizeCategory);
  return [...new Set(['portfolio', ...normalized])];
}

function normalizeGalleryItem(item, index, options = {}) {
  if (!isApprovedGalleryItem(item)) return null;
  const imageUrl = item.imageUrl || item.url || item.mediaUrl || (options.allowFallbackImage ? ADMIN_IMAGE_ASSETS.gallery.portfolioHighlight : '');
  if (!imageUrl) return null;
  const categories = uniqueCategories(item);
  const service = item.service || {};
  const stylist = item.stylist || {};
  return {
    id: item._id || item.id || `gallery-${index}`,
    title: item.title || item.serviceName || service.title || service.name || item.styleName || 'Approved portfolio work',
    caption: item.caption || item.description || item.shortDescription || 'Approved beauty work from the GlowBelle marketplace.',
    category: readableCategory(item.category || categories[1] || categories[0]),
    categories,
    imageUrl: assetUrl(imageUrl),
    mediaType: item.mediaType || 'image',
    stylistId: item.stylistId || stylist._id || stylist.id || '',
    stylistName: item.stylistName || stylist.name || '',
    serviceId: item.serviceId || service._id || service.id || '',
    serviceName: item.serviceName || service.title || service.name || '',
    uploadedAt: item.uploadedAt || item.createdAt || '',
    isFeatured: Boolean(item.isFeatured),
  };
}

function fallbackGalleryItems() {
  const portfolioItems = MOCK_STYLISTS.flatMap(stylist => (stylist.portfolioItems || [])
    .filter(isApprovedGalleryItem)
    .map((item, index) => normalizeGalleryItem({
      ...item,
      id: `${stylist.id}-portfolio-${index}`,
      title: item.title,
      caption: `${item.title} by ${stylist.name}.`,
      category: stylist.skills?.[0] || 'Portfolio',
      categories: ['portfolio', ...(stylist.skills || [])],
      stylistId: stylist.id,
      stylistName: stylist.name,
      uploadedAt: '2026-06-20',
    }, index, { allowFallbackImage: true })))
    .filter(Boolean);

  return [
    ...APPROVED_GALLERY_FALLBACK.map((item, index) => normalizeGalleryItem(item, index, { allowFallbackImage: true })).filter(Boolean),
    ...portfolioItems,
  ];
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export default function GalleryPage({ setPage }) {
  const [cat, setCat] = useState('all');
  const [selected, setSelected] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const id = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await glowbelleApi.gallery();
        const liveItems = (response.data || []).map(normalizeGalleryItem).filter(Boolean);
        setGallery(liveItems);
      } catch {
        setGallery(fallbackGalleryItems());
        setLoadError('');
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const filtered = useMemo(() => (
    cat === 'all' ? gallery : gallery.filter(item => item.categories.includes(cat))
  ), [cat, gallery]);

  const emptyTitle = cat === 'all' ? 'No approved portfolio work yet' : 'No approved images in this category yet.';
  const emptyText = cat === 'all'
    ? 'Verified professionals will appear here once their work is approved by GlowBelle.'
    : 'Try another category or browse verified professionals while new work is approved.';

  function imageFor(item) {
    return imageErrors[item.id] ? assetUrl(ADMIN_IMAGE_ASSETS.gallery.portfolioHighlight) : item.imageUrl;
  }

  function markImageError(id) {
    setImageErrors(current => ({ ...current, [id]: true }));
  }

  function viewStylist(item) {
    if (!item.stylistId && !item.stylistName) return;
    setSelected(null);
    setPage('stylists', { stylistId: item.stylistId, stylistName: item.stylistName });
  }

  function bookSimilar(item) {
    setSelected(null);
    if (item.serviceId) setPage('booking', { serviceId: item.serviceId, serviceName: item.serviceName });
    else setPage('services');
  }

  return (
    <div className="gallery-page-shell">
      <section className="gallery-market-hero">
        <div>
          <span className="eyebrow"><ImageIcon size={14} /> Approved portfolio</span>
          <h1>Gallery</h1>
          <p>Browse approved beauty work from GlowBelle professionals, including portfolio images, service results and before-and-after moments.</p>
        </div>
        <div className="gallery-hero-card">
          <img src={ADMIN_IMAGE_ASSETS.gallery.portfolioHighlight} alt="Approved GlowBelle portfolio highlight" loading="lazy" />
          <span>Approved work only</span>
        </div>
      </section>

      <div className="gallery-filters" aria-label="Gallery filters">
        {GALLERY_CATS.map(c => (
          <button key={c.id} className={cat === c.id ? 'pill-btn active' : 'pill-btn'} onClick={() => setCat(c.id)}>{c.label}</button>
        ))}
      </div>

      {loading && <div className="empty-state gallery-empty-state"><span>Loading</span><h3>Loading approved gallery</h3><p>Fetching approved portfolio images from GlowBelle.</p></div>}
      {!loading && loadError && <div className="empty-state gallery-empty-state"><span>Issue</span><h3>Gallery could not load</h3><p>{loadError}</p></div>}
      {!loading && !loadError && !filtered.length && (
        <div className="empty-state gallery-empty-state">
          <UserRound size={36} />
          <h3>{emptyTitle}</h3>
          <p>{emptyText}</p>
          <div className="empty-actions">
            <button onClick={() => setPage('stylists')}>Browse Stylists</button>
            <button className="secondary" onClick={() => setPage('services')}>Browse Services</button>
          </div>
        </div>
      )}

      {!loading && !loadError && filtered.length > 0 && (
        <div className="gallery-grid approved-gallery-grid">
          {filtered.map(item => (
            <article className="gallery-item approved-gallery-card" key={item.id} onClick={() => setSelected(item)}>
              <div className="gallery-media-frame">
                {isVideoMedia(item)
                  ? <video src={imageFor(item)} muted playsInline preload="metadata" />
                  : <img src={imageFor(item)} alt={item.title} loading="lazy" onError={() => markImageError(item.id)} />}
              </div>
              <div className="gallery-overlay">
                <small>{item.category}</small>
                <span>{item.title}</span>
                {item.stylistName && <small>By {item.stylistName}</small>}
                <p>{item.caption}</p>
                <div className="gallery-card-actions">
                  {(item.stylistId || item.stylistName) && (
                    <button className="secondary" onClick={event => { event.stopPropagation(); viewStylist(item); }}><UserRound size={14} /> View Stylist</button>
                  )}
                  {(item.serviceId || item.serviceName) && (
                    <button onClick={event => { event.stopPropagation(); bookSimilar(item); }}>Book Similar <ArrowRight size={14} /></button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-overlay gallery-lightbox-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card gallery-modal-card gallery-lightbox-card" onClick={event => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close gallery preview"><X size={16} /></button>
            <div className="gallery-lightbox-media">
              {isVideoMedia(selected)
                ? <video className="gallery-modal-media" src={imageFor(selected)} controls playsInline />
                : <img className="gallery-modal-media" src={imageFor(selected)} alt={selected.title} onError={() => markImageError(selected.id)} />}
            </div>
            <div className="gallery-lightbox-details">
              <span className="gallery-category-badge">{selected.category}</span>
              <h2>{selected.title}</h2>
              {selected.caption && <p>{selected.caption}</p>}
              <div className="gallery-meta-list">
                {selected.stylistName && <span><UserRound size={14} /> {selected.stylistName}</span>}
                {formatDate(selected.uploadedAt) && <span><CalendarDays size={14} /> {formatDate(selected.uploadedAt)}</span>}
                {selected.serviceName && <span>{selected.serviceName}</span>}
              </div>
              <div className="gallery-modal-actions">
                {(selected.stylistId || selected.stylistName) && <button onClick={() => viewStylist(selected)}>View Stylist</button>}
                {(selected.serviceId || selected.serviceName) && <button onClick={() => bookSimilar(selected)}>Book Similar Service</button>}
                <button className="secondary" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
