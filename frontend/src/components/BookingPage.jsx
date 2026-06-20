import { CalendarDays, Upload, Tag, MapPin, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';
import PageHero from './PageHero.jsx';
import Step from './Step.jsx';
import { assetUrl, glowbelleApi } from '../api.js';
import { attachProviderCounts, offeringForService } from '../marketplace.js';
import { money } from '../utils.js';

const TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:30 PM', '2:30 PM', '3:30 PM', '5:00 PM', '6:00 PM'];
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

function normalizeService(item) {
  return {
    ...item,
    id: item.code || item.id || item._id,
    tag: item.emoji || item.tag || '',
    duration: item.duration || `${item.durationMinutes || 60} min`,
    addons: item.addons || [],
  };
}

function normalizeStylist(item) {
  return {
    ...item,
    id: item.code || item.id || item._id,
    available: item.available !== false,
  };
}

function normalizeBranch(item) {
  return { ...item, id: item.code || item.id || item._id };
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

function offerDiscount(offer, subtotal) {
  if (!offer) return 0;
  if (offer.minSpend && subtotal < offer.minSpend) return 0;
  const rawDiscount = offer.discountType === 'fixed'
    ? Number(offer.discountValue || 0)
    : Math.round(subtotal * (Number(offer.discountValue || 0) / 100));
  return Math.min(Math.max(rawDiscount, 0), subtotal);
}

function offerSuccessText(offer) {
  if (!offer) return '';
  const discountText = offer.discountType === 'fixed'
    ? `${money(offer.discountValue)} off`
    : `${offer.discountValue}% off`;
  return `${offer.code} applied - ${discountText}`;
}

export default function BookingPage({ setPage, nav, user }) {
  const [catalog, setCatalog] = useState({
    services: [],
    stylists: [],
    branches: [],
  });
  const preService = catalog.services.find(s => s.id === nav?.serviceId || s._id === nav?.serviceId) || catalog.services[0];
  const preStyled = catalog.stylists.find(st => st.id === nav?.stylistId || st._id === nav?.stylistId) || null;

  const [service, setService] = useState(preService || null);
  const [stylist, setStylist] = useState(preStyled);
  const [location, setLocation] = useState('Salon visit');
  const [branch, setBranch] = useState(catalog.branches[0]?.id || '');
  const [family, setFamily] = useState('Me');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('2:30 PM');
  const [notes, setNotes] = useState('');
  const [addons, setAddons] = useState([]);
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);
  const [inspImg, setInspImg] = useState(null);
  const [payment, setPayment] = useState('pay-salon');
  const [homeAddress, setHomeAddress] = useState('');
  const [guest, setGuest] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => {
    const id = window.setTimeout(async () => {
      setCatalogLoading(true);
      setCatalogError('');
      try {
        const [servicesRes, stylistsRes, branchesRes] = await Promise.all([
          glowbelleApi.services({ limit: 100 }),
          glowbelleApi.stylists({ available: true }),
          glowbelleApi.branches(),
        ]);
        const nextStylists = (stylistsRes.data || []).map(normalizeStylist);
        const next = {
          services: attachProviderCounts((servicesRes.data || []).map(normalizeService), nextStylists),
          stylists: nextStylists,
          branches: (branchesRes.data || []).map(normalizeBranch),
        };
        setCatalog(next);
        const nextService = next.services.find(item => item.id === nav?.serviceId || item._id === nav?.serviceId) || next.services[0];
        const nextStylist = next.stylists.find(item => item.id === nav?.stylistId || item._id === nav?.stylistId) || null;
        if (nextService) setService(nextService);
        setStylist(nextStylist);
        if (next.branches[0]) setBranch(next.branches[0].id);
      } catch (err) {
        setCatalog({ services: [], stylists: [], branches: [] });
        setService(null);
        setStylist(null);
        setCatalogError(err.message || 'Unable to load the live booking catalog.');
      } finally {
        setCatalogLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [nav?.serviceId, nav?.stylistId]);

  if (catalogLoading) {
    return <>
      <PageHero title="Book appointment" text="Loading live services, stylists and branches." icon={<CalendarDays />} />
      <div className="empty-state"><span>⌛</span><h3>Loading booking catalog</h3><p>Fetching current services and verified professionals from the backend.</p></div>
    </>;
  }

  if (catalogError || !service) {
    return <>
      <PageHero title="Book appointment" text="Choose your service, stylist, date, time and location." icon={<CalendarDays />} />
      <div className="empty-state">
        <span>{catalogError ? '⚠' : '✦'}</span>
        <h3>{catalogError ? 'Booking catalog could not load' : 'No active services yet'}</h3>
        <p>{catalogError || 'Active services will appear here as soon as they are published.'}</p>
        <button onClick={() => setPage('services')}>View services</button>
      </div>
    </>;
  }

  const travel = location === 'Home service' ? 5000 : 0;
  const offering = offeringForService(stylist, service);
  const servicePrice = offering?.price ?? service.price;
  const serviceDuration = offering?.durationMinutes ? `${offering.durationMinutes} min` : service.duration;
  const publicDescription = offering?.description || service.shortDescription || service.description || '';
  const publicImage = offering?.imageUrl || service.imageUrl || '';
  const addonsTotal = addons.reduce((sum, addon) => sum + addonPrice(addon), 0);
  const subtotal = servicePrice + travel + addonsTotal;
  const discount = offerDiscount(promoApplied, subtotal);
  const total = subtotal - discount;

  async function applyPromo() {
    const code = promo.trim().toUpperCase();
    setPromoError('');
    setPromoApplied(null);
    if (!code) {
      setPromoError('Enter a promo code first.');
      return;
    }
    setPromoBusy(true);
    try {
      const response = await glowbelleApi.validateOffer(code, {
        serviceId: service?._id || service?.id || '',
        stylistId: stylist?._id || stylist?.id || '',
      });
      const offer = response.data;
      if (offer.maxUses && offer.usedCount >= offer.maxUses) {
        throw new Error('This promo code has reached its usage limit.');
      }
      if (offer.minSpend && subtotal < offer.minSpend) {
        throw new Error(`Minimum spend for this promo is ${money(offer.minSpend)}.`);
      }
      setPromoApplied(offer);
      setPromo(response.data.code);
    } catch (err) {
      setPromoError(err.message || 'Promo code is not valid.');
    } finally {
      setPromoBusy(false);
    }
  }

  function toggleAddon(a) {
    setAddons(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  function selectStylist(nextStylist) {
    setStylist(nextStylist);
    if (!nextStylist && payment !== 'pay-salon') setPayment('pay-salon');
  }

  const selectedBranch = catalog.branches.find(b => b.id === branch);
  const stylistsForService = catalog.stylists.filter(st => offeringForService(st, service));
  const canReview = Boolean(stylist && offering);

  return (
    <>
      <PageHero title="Book appointment" text="Choose your service, stylist, date, time and location." icon={<CalendarDays />} />
      <div className="booking-layout">
        <div className="booking-main">
          {/* Step 1: Service */}
          <Step n="1" title="Select service">
            <div className="chip-list">
              {catalog.services.map(item => (
                <button className={service.id === item.id ? 'chip selected' : 'chip'} onClick={() => { setService(item); setAddons([]); if (!offeringForService(stylist, item)) setStylist(null); }} key={item.id}>
                  {item.tag} {item.title}<small>{item.providerCount > 0 ? `${item.providerCount} pro${item.providerCount === 1 ? '' : 's'} available` : 'Opening soon'}</small>
                </button>
              ))}
            </div>
          </Step>

          {/* Add-ons */}
          {service.addons?.length > 0 && (
            <Step n="1b" title="Optional add-ons">
              <div className="chip-list">
                {service.addons.map(a => (
                  <button key={addonLabel(a)} className={addons.includes(a) ? 'chip selected' : 'chip'} onClick={() => toggleAddon(a)}>{addonLabel(a)}</button>
                ))}
              </div>
            </Step>
          )}

          {/* Step 2: Stylist */}
          <Step n="2" title="Choose stylist">
            <div className="stylist-row">
              {stylistsForService.map(st => (
                <button key={st.id} className={stylist?.id === st.id ? 'stylist-mini selected' : 'stylist-mini'} onClick={() => selectStylist(st)}>
                  <Avatar name={st.name} src={st.avatarUrl} />
                  <strong>{st.name}</strong>
                  <span>{st.role}</span>
                  <span>{money(offeringForService(st, service)?.price || 0)}</span>
                  <span style={{ fontSize: 11, color: 'var(--gold)' }}>⭐ {st.rating}</span>
                  {!st.available && <span className="unavail-tag">Off today</span>}
                </button>
              ))}
            </div>
            {stylistsForService.length === 0 && <div className="note-box prep" style={{ marginTop: 12 }}>No approved stylist has published this service yet. Customers can browse it now, and booking opens when a stylist adds their price, image, description and availability.</div>}
          </Step>

          {/* Step 3: Family & Location */}
          <Step n="3" title="For whom & location">
            <div className="two-col">
              <div>
                <label className="field-label">Booking for</label>
                <select value={family} onChange={e => setFamily(e.target.value)}>
                  <option>Me</option>
                  {user && <option>My partner</option>}
                  <option>My child (age 3–12)</option>
                  <option>My child (teenager)</option>
                  <option>Family package</option>
                </select>
              </div>
              <div>
                <label className="field-label">Service location</label>
                <select value={location} onChange={e => setLocation(e.target.value)}>
                  <option>Salon visit</option>
                  <option>Home service (+₦5,000)</option>
                </select>
              </div>
            </div>
            {location === 'Salon visit' && (
              <div style={{ marginTop: 12 }}>
                <label className="field-label">Select branch</label>
                <select value={branch} onChange={e => setBranch(e.target.value)}>
                  {catalog.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {selectedBranch && (
                  <div className="branch-info"><MapPin size={14} /> {selectedBranch.address} · {selectedBranch.phone}</div>
                )}
              </div>
            )}
            {location === 'Home service' && (
              <div style={{ marginTop: 12 }}>
                <label className="field-label">Your address</label>
                <input placeholder="House number, street, area and nearest landmark" value={homeAddress} onChange={e => setHomeAddress(e.target.value)} />
                <div className="note-box prep" style={{ marginTop: 8 }}>🏠 Home service is available within Lagos. Our stylist will arrive within the estimated window. Travel fee: ₦5,000.</div>
              </div>
            )}
          </Step>

          {/* Step 4: Date & Time */}
          <Step n="4" title="Date & time">
            <div className="two-col">
              <div>
                <label className="field-label">Preferred date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} min={today()} />
              </div>
              <div>
                <label className="field-label">Preferred time</label>
                <select value={time} onChange={e => setTime(e.target.value)}>
                  {TIMES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="time-slots">
              {TIMES.map(t => (
                <button key={t} className={time === t ? 'time-slot active' : 'time-slot'} onClick={() => setTime(t)}>{t}</button>
              ))}
            </div>
          </Step>

          {/* Step 5: Notes & inspiration */}
          <Step n="5" title="Notes & inspiration">
            <label className="field-label">Special notes (allergies, hair type, requests)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tell the stylist your hair type, allergies, preferred style, colour, length or special requests." />
            <div style={{ marginTop: 12 }}>
              <label className="field-label">Upload inspiration image (optional)</label>
              <div className="upload-zone" onClick={() => document.getElementById('insp-file').click()}>
                {inspImg ? <span>Image selected: {inspImg.name}</span> : <><Upload size={20} /> <span>Click to upload inspiration photo</span></>}
                <input id="insp-file" type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => setInspImg(e.target.files[0] || null)} />
              </div>
            </div>
          </Step>


          {!user && (
            <Step n="5b" title="Your contact details">
              <div className="two-col">
                <div>
                  <label className="field-label">Full name</label>
                  <input value={guest.name} onChange={e => setGuest({ ...guest, name: e.target.value })} placeholder="Full name for the booking" />
                </div>
                <div>
                  <label className="field-label">Phone / WhatsApp</label>
                  <input value={guest.phone} onChange={e => setGuest({ ...guest, phone: e.target.value })} placeholder="Phone/WhatsApp, e.g. 08012345678" />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label className="field-label">Email</label>
                <input type="email" value={guest.email} onChange={e => setGuest({ ...guest, email: e.target.value })} placeholder="Email for confirmation, e.g. you@example.com" />
              </div>
            </Step>
          )}

          {/* Step 6: Promo & Payment */}
          <Step n="6" title="Promo code & payment">
            <div className="promo-row">
              <input placeholder="Promo code, if you have one" value={promo} onChange={e => setPromo(e.target.value)} style={{ flex: 1 }} />
              <button className="promo-apply" onClick={applyPromo} disabled={promoBusy}><Tag size={16} /> {promoBusy ? 'Checking...' : 'Apply'}</button>
            </div>
            {promoApplied && <div className="promo-success">Code <b>{offerSuccessText(promoApplied)}</b>.</div>}
            {promoError && <div className="promo-error"><AlertCircle size={14} /> {promoError}</div>}

            <label className="field-label" style={{ marginTop: 16 }}>Payment method</label>
            <div className="payment-options">
              {[
                ['pay-salon', '🏪 Pay at salon'],
              ].map(([val, label]) => (
                <label key={val} className={payment === val ? 'pay-opt active' : 'pay-opt'}>
                  <input type="radio" name="payment" value={val} checked={payment === val} onChange={() => setPayment(val)} style={{ display: 'none' }} />
                  {label}
                </label>
              ))}
            </div>
            <div className="note-box prep" style={{ marginTop: 10 }}>GlowBelle uses Pay at Salon only. Customers book now and pay the stylist directly after the service.</div>
          </Step>
        </div>

        {/* Summary sidebar */}
        <aside className="summary">
          <h3>Booking summary</h3>
          <div className="summary-service">
            {publicImage ? <img src={assetUrl(publicImage)} alt={service.title} /> : <span>{service.tag}</span>}
            <div>
              <strong>{service.title}</strong>
              <p>{serviceDuration} · {stylist ? stylist.name : 'Choose stylist'}</p>
              {publicDescription && <p>{publicDescription.slice(0, 95)}{publicDescription.length > 95 ? '...' : ''}</p>}
              <p>{date} · {time}</p>
            </div>
          </div>
          <div className="line"><span>Service</span><b>{money(servicePrice)}</b></div>
          {addons.map(a => {
            const p = addonPrice(a);
            return <div className="line" key={addonLabel(a)}><span>{addonLabel(a).split('(')[0].trim()}</span><b>{money(p)}</b></div>;
          })}
          {travel > 0 && <div className="line"><span>Travel fee</span><b>{money(travel)}</b></div>}
          {discount > 0 && <div className="line" style={{ color: 'var(--green)' }}><span>Promo ({promoApplied.code})</span><b>-{money(discount)}</b></div>}
          <div className="line total"><span>Total</span><b>{money(total)}</b></div>
          {!canReview && <div className="note-box prep" style={{ marginBottom: 12 }}>Choose a stylist first so the booking uses that stylist's own price.</div>}
          <button disabled={!canReview} style={{ opacity: canReview ? 1 : 0.55 }} onClick={() => setPage('confirm', { service: { ...service, price: servicePrice, duration: serviceDuration }, stylist, date, time, location, branch, branchDetails: selectedBranch, family, total, payment, notes, promoCode: promoApplied?.code, addons, homeAddress, guest, inspirationImage: inspImg })}>Review & Confirm</button>
          <p style={{ fontSize: 12, color: 'var(--text)', marginTop: 12, textAlign: 'center' }}>🔒 Secure booking. Free cancellation 24hrs before.</p>
        </aside>
      </div>
    </>
  );
}
