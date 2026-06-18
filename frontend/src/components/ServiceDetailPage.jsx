import { Star, Clock, User, ChevronLeft, CheckCircle2, AlertCircle, Heart, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { assetUrl, glowbelleApi } from '../api.js';
import { primaryOfferingForService, providerCountForService } from '../marketplace.js';
import { money } from '../utils.js';

function normalizeService(item) {
  return {
    ...item,
    id: item.code || item.id || item._id,
    cat: item.cat || item.category,
    tag: item.tag || item.emoji || '',
    desc: item.desc || item.description || item.shortDescription || '',
    duration: item.duration || `${item.durationMinutes || 60} min`,
    gender: item.gender || 'All customers',
    minAge: item.minAge || 0,
    addons: item.addons || [],
    prep: item.prep || 'Your stylist will provide service-specific preparation guidance.',
    aftercare: item.aftercare || 'Your stylist will provide aftercare guidance after the service.',
  };
}

function addonLabel(addon) {
  if (typeof addon === 'string') return addon;
  return `${addon.name}${addon.price ? ` (${money(addon.price)})` : ''}`;
}

function addonPrice(addon) {
  if (typeof addon === 'object') return Number(addon.price || 0);
  const match = String(addon).match(/₦([\d,]+)/);
  return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
}

export default function ServiceDetailPage({ setPage, nav }) {
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [providerCount, setProviderCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState([]);

  useEffect(() => {
    const id = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');
      if (!nav?.serviceId) {
        setLoadError('No service was selected.');
        setLoading(false);
        return;
      }
      try {
        const response = await glowbelleApi.service(nav.serviceId);
        const nextService = normalizeService(response.data);
        setService(nextService);
        setSelectedAddon([]);
        const [relatedResponse, stylistsResponse] = await Promise.all([
          glowbelleApi.services({ category: nextService.cat, limit: 4 }),
          glowbelleApi.stylists({ available: true }).catch(() => ({ data: [] })),
        ]);
        const stylists = stylistsResponse.data || [];
        const primary = primaryOfferingForService(nextService, stylists);
        if (primary?.offering) {
          nextService.imageUrl = primary.offering.imageUrl || nextService.imageUrl;
          nextService.price = primary.offering.price ?? nextService.price;
          nextService.duration = primary.offering.durationMinutes ? `${primary.offering.durationMinutes} min` : nextService.duration;
          nextService.desc = primary.offering.description || nextService.desc;
        }
        setProviderCount(providerCountForService(nextService, stylists));
        setRelatedServices((relatedResponse.data || [])
          .map(normalizeService)
          .filter(item => item.id !== nextService.id)
          .slice(0, 3));
      } catch (err) {
        setService(null);
        setRelatedServices([]);
        setLoadError(err.message || 'Unable to load service details.');
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [nav?.serviceId]);

  function toggleAddon(addon) {
    setSelectedAddon(prev => prev.includes(addon) ? prev.filter(a => a !== addon) : [...prev, addon]);
  }

  const addonsTotal = selectedAddon.reduce((sum, a) => {
    return sum + addonPrice(a);
  }, 0);

  if (loading) return <div className="empty-state"><span>⌛</span><h3>Loading service details</h3><p>Fetching this service from the backend.</p></div>;
  if (loadError || !service) {
    return <div className="empty-state">
      <span>⚠</span>
      <h3>Service details unavailable</h3>
      <p>{loadError || 'This service is no longer active.'}</p>
      <button onClick={() => setPage('services')}>Back to services</button>
    </div>;
  }

  return (
    <div className="service-detail">
      <div className="detail-breadcrumb">
        <button onClick={() => setPage('services')}><ChevronLeft size={16} /> Services</button>
        <span>/</span>
        <span>{service.title}</span>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          {/* Image / Art */}
          <div className={`detail-art ${service.cat}`}>
            {service.imageUrl ? <img src={assetUrl(service.imageUrl)} alt={service.title} /> : <span>{service.tag}</span>}
            <div className="detail-art-actions">
              <button onClick={() => setFavorited(!favorited)} className={favorited ? 'fav-btn active' : 'fav-btn'}><Heart size={18} /></button>
              <button className="fav-btn"><Share2 size={18} /></button>
            </div>
          </div>

          {/* Info */}
          <div className="detail-info">
            <div className="between" style={{ marginBottom: 8 }}>
              <h1 style={{ fontSize: 28, margin: 0 }}>{service.title}</h1>
              <span className="rating"><Star size={16} />Starting from {money(service.price)}</span>
            </div>
            <p style={{ color: 'var(--text)', marginBottom: 20, lineHeight: 1.6 }}>{service.desc}</p>

            <div className="detail-meta">
              <div className="meta-item"><Clock size={16} /><span>Duration: <b>{service.duration}</b></span></div>
              <div className="meta-item"><User size={16} /><span>Suitable for: <b>{service.gender}</b></span></div>
              <div className="meta-item"><span>📅</span><span>Min age: <b>{service.minAge === 0 ? 'All ages' : `${service.minAge}+`}</b></span></div>
            </div>

            {/* Add-ons */}
            <div className="detail-section">
              <h3>Available add-ons</h3>
              <div className="addon-list">
                {service.addons.map(addon => (
                  <button key={addonLabel(addon)} className={selectedAddon.includes(addon) ? 'addon-chip selected' : 'addon-chip'} onClick={() => toggleAddon(addon)}>
                    {selectedAddon.includes(addon) && <CheckCircle2 size={14} />}
                    {addonLabel(addon)}
                  </button>
                ))}
              </div>
            </div>

            {/* Prep notes */}
            <div className="detail-section">
              <h3><AlertCircle size={16} /> Preparation notes</h3>
              <div className="note-box prep">{service.prep}</div>
            </div>

            <div className="detail-section">
              <h3>✨ Aftercare</h3>
              <div className="note-box after">{service.aftercare}</div>
            </div>

            <div className="detail-section">
              <h3>Verified professionals</h3>
              <div className={providerCount > 0 ? 'note-box after' : 'note-box prep'}>{providerCount > 0 ? `${providerCount} verified professional${providerCount === 1 ? '' : 's'} currently offer this service.` : 'No verified stylist has published this service yet. It will become bookable when a stylist adds their price, image and availability.'}</div>
            </div>

            {/* Related */}
            {relatedServices.length > 0 && (
              <div className="detail-section">
                <h3>Related services</h3>
                <div className="related-list">
                  {relatedServices.map(s => (
                    <button key={s.id} className="related-card" onClick={() => setPage('service-detail', { serviceId: s.id })}>
                      <span className="related-tag">{s.tag}</span>
                      <div>
                        <strong>{s.title}</strong>
                        <span>{money(s.price)} · {s.duration}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="detail-sidebar">
          <div className="summary sticky-sum">
            <h3>Book this service</h3>
            <div className="line"><span>Base price</span><b>{money(service.price)}</b></div>
            {selectedAddon.map(a => {
              const price = addonPrice(a);
              return <div className="line" key={addonLabel(a)}><span>{addonLabel(a).split('(')[0].trim()}</span><b>{money(price)}</b></div>;
            })}
            {addonsTotal > 0 && <div className="line total"><span>Total</span><b>{money(service.price + addonsTotal)}</b></div>}
            <button disabled={providerCount === 0} onClick={() => providerCount > 0 && setPage('booking', { serviceId: service.id })} style={{ width: '100%', background: providerCount > 0 ? 'var(--brand)' : 'var(--text)', color: '#fff', border: 'none', padding: '13px', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 600, cursor: providerCount > 0 ? 'pointer' : 'not-allowed', marginTop: 16, opacity: providerCount > 0 ? 1 : 0.55 }}>
              {providerCount > 0 ? 'Book This Service' : 'Opening Soon'}
            </button>
            <button className="secondary" style={{ width: '100%', marginTop: 8, padding: '11px', borderRadius: 'var(--radius-sm)', fontSize: 14, cursor: 'pointer' }} onClick={() => setFavorited(!favorited)}>
              {favorited ? '❤️ Saved to Favorites' : '♡ Save to Favorites'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
