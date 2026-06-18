import { Gift, Tag, Copy, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import PageHero from './PageHero.jsx';
import { glowbelleApi } from '../api.js';

const CAT_LABELS = { all: 'All', family: 'Family', bridal: 'Bridal', men: "Men's", spa: 'Spa', kids: 'Kids' };

export default function OffersPage({ setPage }) {
  const [cat, setCat] = useState('all');
  const [copied, setCopied] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const id = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await glowbelleApi.offers();
        setItems((response.data || []).map(offer => ({
          id: offer._id || offer.code,
          title: offer.title,
          text: offer.description,
          price: offer.priceText || `${offer.discountValue}${offer.discountType === 'percent' ? '% off' : ' off'}`,
          old: offer.oldPriceText,
          code: offer.code,
          cat: offer.category || 'all',
          badge: offer.badge,
          stylist: offer.stylist,
          service: offer.service,
          ownerType: offer.ownerType || 'admin',
        })));
      } catch (err) {
        setItems([]);
        setLoadError(err.message || 'Unable to load active offers.');
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const filtered = cat === 'all' ? items : items.filter(o => o.cat === cat || o.cat === 'all');

  function copyCode(code) {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <>
      <PageHero title="Offers & packages" text="Save more with family bundles, bridal packages, first-time discounts and seasonal deals." icon={<Gift />} />

      <div className="offers-filters">
        {Object.entries(CAT_LABELS).map(([id, label]) => (
          <button key={id} className={cat === id ? 'pill-btn active' : 'pill-btn'} onClick={() => setCat(id)}>{label}</button>
        ))}
      </div>

      {loading && <div className="empty-state"><span>⌛</span><h3>Loading active offers</h3><p>Fetching promotions from the backend.</p></div>}
      {!loading && loadError && <div className="empty-state"><span>⚠</span><h3>Offers could not load</h3><p>{loadError}</p></div>}
      {!loading && !loadError && !filtered.length && <div className="empty-state"><span>✦</span><h3>No active offers</h3><p>Admin-managed offers will appear here when published.</p></div>}
      {!loading && !loadError && filtered.length > 0 && <div className="grid three" style={{ paddingBottom: 48 }}>
        {filtered.map(offer => (
          <article className="offer" key={offer.id}>
            {offer.badge && <span className="offer-badge">{offer.badge}</span>}
            <h3>{offer.title}</h3>
            <p>{offer.text}</p>
            {offer.ownerType === 'stylist' && offer.stylist?.name && <p className="offer-owner">By {offer.stylist.name}{offer.service?.title ? ` · ${offer.service.title}` : ''}</p>}
            <div className="offer-price-row">
              <b>{offer.price}</b>
              {offer.old && <s>{offer.old}</s>}
            </div>
            <div className="offer-code-row">
              <code><Tag size={12} /> {offer.code}</code>
              <button className="copy-btn" onClick={() => copyCode(offer.code)}>
                {copied === offer.code ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <button onClick={() => setPage('booking')}>Use Offer</button>
          </article>
        ))}
      </div>}

      <section className="loyalty-section"><div className="loyalty-inner"><div><span className="pill">Marketplace offers</span><h2>Real discounts from GlowBelle and verified stylists</h2><p>Admin can publish platform-wide offers, and approved stylists can publish their own service discounts.</p></div></div></section>
    </>
  );
}
