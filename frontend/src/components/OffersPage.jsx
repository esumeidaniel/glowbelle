import { Check, Copy, Gift, Info, Sparkles, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { assetUrl, glowbelleApi } from '../api.js';
import { ADMIN_IMAGE_ASSETS } from '../catalog.js';
import { toast } from '../toast.js';
import { money } from '../utils.js';

const CATEGORIES = [
  ['all', 'All'],
  ['family', 'Family'],
  ['bridal', 'Bridal'],
  ['men', "Men's"],
  ['spa', 'Spa'],
  ['kids', 'Kids'],
  ['first-time', 'First-time'],
  ['referral', 'Referral'],
  ['seasonal', 'Seasonal'],
  ['stylist', 'Stylist Offers'],
];

const OFFER_IMAGES = {
  family: ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
  bridal: ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
  men: ADMIN_IMAGE_ASSETS.categories.barbering,
  barbering: ADMIN_IMAGE_ASSETS.categories.barbering,
  spa: ADMIN_IMAGE_ASSETS.categories.spaWellness,
  kids: ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
  'first-time': ADMIN_IMAGE_ASSETS.hero.beautyServices,
  referral: ADMIN_IMAGE_ASSETS.hero.marketplace,
  seasonal: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
  stylist: ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
  all: ADMIN_IMAGE_ASSETS.hero.beautyServices,
};

function categoryKey(value = 'all') {
  const normalized = String(value || 'all').trim().toLowerCase();
  if (['men', "men's", 'mens', 'barber', 'barbering', 'grooming'].includes(normalized)) return 'men';
  if (['child', 'children', 'children-hair', 'childrens-salon', 'kids'].includes(normalized)) return 'kids';
  if (['bride', 'bridal-events', 'wedding', 'bridal'].includes(normalized)) return 'bridal';
  if (['first', 'new', 'new-client', 'first-time', 'welcome'].includes(normalized)) return 'first-time';
  if (['stylist-offers', 'stylist offer'].includes(normalized)) return 'stylist';
  return normalized;
}

function discountText(offer) {
  if (offer.priceText) return offer.priceText;
  if (offer.discountType === 'fixed') return `${money(offer.discountValue || 0)} OFF`;
  return `${Number(offer.discountValue || 0)}% OFF`;
}

function expiryText(offer) {
  const raw = offer.expiresAt || offer.endDate || offer.validUntil;
  if (!raw) return 'No expiry listed';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(raw);
  return `Valid until ${date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

function isExpired(offer) {
  const raw = offer.expiresAt || offer.endDate || offer.validUntil;
  if (!raw) return false;
  const date = new Date(raw);
  return !Number.isNaN(date.getTime()) && date < new Date();
}

function activePublicOffer(offer) {
  const status = String(offer.status || offer.approvalStatus || 'active').toLowerCase();
  const hiddenStatuses = ['inactive', 'draft', 'expired', 'preview', 'preview-only', 'demo', 'pending', 'rejected', 'declined', 'suspended'];
  if (offer.demo || offer.preview || offer.previewOnly || offer.isActive === false || offer.isPublished === false) return false;
  if (hiddenStatuses.includes(status)) return false;
  if (offer.maxUses && Number(offer.usedCount || 0) >= Number(offer.maxUses)) return false;
  return !isExpired(offer);
}

function normalizeOffer(offer) {
  const sourceType = offer.sourceType || offer.ownerType || (offer.stylist ? 'stylist' : 'platform');
  const cat = sourceType === 'stylist' ? 'stylist' : categoryKey(offer.category || offer.cat || 'all');
  return {
    ...offer,
    id: offer._id || offer.id || offer.code,
    title: offer.title || 'GlowBelle offer',
    text: offer.description || offer.text || 'Save on eligible GlowBelle services.',
    discount: discountText(offer),
    old: offer.oldPriceText || offer.old || '',
    code: String(offer.code || '').toUpperCase(),
    cat,
    categoryLabel: CATEGORIES.find(([id]) => id === cat)?.[1] || 'Offer',
    sourceType,
    imageUrl: offer.imageUrl || OFFER_IMAGES[cat] || OFFER_IMAGES.all,
    expires: expiryText(offer),
    terms: offer.terms || [
      offer.minSpend ? `Minimum spend ${money(offer.minSpend)}.` : '',
      offer.maxUses ? `Limited to ${offer.maxUses} total uses.` : '',
      offer.service?.title ? `Valid for ${offer.service.title}.` : '',
      sourceType === 'stylist' && offer.stylist?.name ? `Valid with ${offer.stylist.name}.` : '',
      'Discount will be confirmed at the salon after booking.',
    ].filter(Boolean).join(' '),
  };
}

export default function OffersPage({ setPage }) {
  const [cat, setCat] = useState('all');
  const [copied, setCopied] = useState('');
  const [items, setItems] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const id = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await glowbelleApi.offers();
        setItems((response.data || []).filter(activePublicOffer).map(normalizeOffer));
      } catch (error) {
        setItems([]);
        setLoadError(error.message || 'Offers could not load. Please try again soon.');
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const filtered = cat === 'all' ? items : items.filter(offer => offer.cat === cat);
  const categoryLabel = CATEGORIES.find(([id]) => id === cat)?.[1] || 'Offers';

  async function copyCode(code) {
    if (!code) return;
    try {
      await navigator.clipboard?.writeText(code);
      toast('Offer code copied', 'success');
    } catch {
      toast('Offer code copied', 'success');
    }
    setCopied(code);
    window.setTimeout(() => setCopied(''), 2000);
  }

  function bookWithOffer(offer) {
    setPage('booking', {
      offerCode: offer.code,
      offerId: offer.id,
      offer,
      serviceId: offer.service?.code || offer.service?._id || offer.service?.id,
      stylistId: offer.stylist?.code || offer.stylist?._id || offer.stylist?.id,
    });
  }

  return (
    <div className="offers-page-shell">
      <section className="offers-market-hero">
        <div>
          <span className="eyebrow"><Gift size={14} /> Customer savings</span>
          <h1>Offers & packages</h1>
          <p>Save more with family bundles, bridal packages, first-time discounts and seasonal deals.</p>
        </div>
        <div className="offers-hero-visual" aria-hidden="true">
          <img src={ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily} alt="" loading="lazy" />
          <span><Sparkles size={18} /> Active deals</span>
        </div>
      </section>

      <div className="offers-filters offers-category-tabs">
        {CATEGORIES.map(([id, label]) => (
          <button key={id} className={cat === id ? 'pill-btn active' : 'pill-btn'} onClick={() => setCat(id)}>{label}</button>
        ))}
      </div>

      {loading && <div className="empty-state"><Gift size={36} /><h3>Loading active offers</h3><p>Fetching current discounts from GlowBelle and verified stylists.</p></div>}
      {!loading && loadError && <div className="empty-state"><Info size={36} /><h3>Offers could not load</h3><p>{loadError}</p></div>}
      {!loading && !loadError && !items.length && (
        <div className="empty-state">
          <Gift size={36} />
          <h3>No active offers yet</h3>
          <p>Fresh discounts from GlowBelle and verified stylists will appear here soon.</p>
          <button onClick={() => setPage('services')}>Browse Services</button>
        </div>
      )}
      {!loading && !loadError && items.length > 0 && !filtered.length && (
        <div className="empty-state">
          <Tag size={36} />
          <h3>No offers in this category yet</h3>
          <p>Check all offers or browse services while new deals are being prepared.</p>
          <div className="empty-actions">
            <button onClick={() => setCat('all')}>View All Offers</button>
            <button className="secondary" onClick={() => setPage('services')}>Browse Services</button>
          </div>
        </div>
      )}
      {!loading && !loadError && filtered.length > 0 && (
        <section className="offers-grid-section">
          <div className="offers-section-head">
            <span>{categoryLabel}</span>
            <h2>{cat === 'all' ? 'Active GlowBelle offers' : `${categoryLabel} offers`}</h2>
            <p>Copy a code or book with an offer. Discounts are checked against the selected service and stylist before confirmation.</p>
          </div>
          <div className="offers-market-grid">
            {filtered.map(offer => (
              <article className="offer market-offer-card" key={offer.id}>
                <div className="offer-media">
                  <img src={assetUrl(offer.imageUrl)} alt={`${offer.title} offer`} loading="lazy" />
                  <span>{offer.categoryLabel}</span>
                </div>
                <div className="offer-content">
                  <div className="offer-topline">
                    <span>{offer.sourceType === 'stylist' ? 'Stylist offer' : 'GlowBelle offer'}</span>
                    <strong>{offer.discount}</strong>
                  </div>
                  <h3>{offer.title}</h3>
                  <p>{offer.text}</p>
                  {offer.sourceType === 'stylist' && offer.stylist?.name && <p className="offer-owner">By {offer.stylist.name}{offer.service?.title ? ` - ${offer.service.title}` : ''}</p>}
                  <div className="offer-meta-list">
                    <span><Tag size={13} /> {offer.code || 'Code applied at booking'}</span>
                    <span>{offer.expires}</span>
                  </div>
                  <p className="offer-terms">{offer.terms}</p>
                </div>
                <div className="offer-actions">
                  {offer.code && (
                    <button className="copy-btn" onClick={() => copyCode(offer.code)}>
                      {copied === offer.code ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Code</>}
                    </button>
                  )}
                  <button className="secondary" onClick={() => setSelectedOffer(offer)}>View Details</button>
                  <button onClick={() => bookWithOffer(offer)}>Book with Offer</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="loyalty-section offers-trust-section">
        <div className="loyalty-inner">
          <div>
            <span className="pill">Marketplace offers</span>
            <h2>Real discounts from GlowBelle and verified stylists</h2>
            <p>Platform offers can apply across eligible services. Stylist offers apply to that professional’s approved services only.</p>
          </div>
        </div>
      </section>

      {selectedOffer && (
        <div className="modal-overlay" onClick={() => setSelectedOffer(null)}>
          <div className="modal-card offer-detail-modal" onClick={event => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedOffer(null)}><X size={16} /></button>
            <img src={assetUrl(selectedOffer.imageUrl)} alt={`${selectedOffer.title} offer`} loading="lazy" />
            <span className="eyebrow"><Gift size={14} /> {selectedOffer.categoryLabel}</span>
            <h2>{selectedOffer.title}</h2>
            <p>{selectedOffer.text}</p>
            <div className="offer-detail-code"><strong>{selectedOffer.discount}</strong><code>{selectedOffer.code}</code></div>
            <p><b>Expires:</b> {selectedOffer.expires}</p>
            <p><b>Terms:</b> {selectedOffer.terms}</p>
            <div className="offer-actions">
              {selectedOffer.code && <button className="copy-btn" onClick={() => copyCode(selectedOffer.code)}><Copy size={14} /> Copy Code</button>}
              <button onClick={() => { setSelectedOffer(null); bookWithOffer(selectedOffer); }}>Book with Offer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
