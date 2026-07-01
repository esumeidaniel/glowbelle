import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  Image as ImageIcon,
  MapPin,
  Star,
  Tag,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';
import Step from './Step.jsx';
import { assetUrl, glowbelleApi } from '../api.js';
import { ADMIN_IMAGE_ASSETS } from '../catalog.js';
import { attachProviderCounts, offeringForService } from '../marketplace.js';
import { stylistIsApproved, stylistRatingText } from '../stylistUtils.js';
import { money } from '../utils.js';

const TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:30 PM', '2:30 PM', '3:30 PM', '5:00 PM', '6:00 PM'];
const BOOKING_FOR_OPTIONS = ['Me', 'Child', 'Family member', 'Someone else'];
const PROGRESS_STEPS = ['Service', 'Stylist', 'Location', 'Date & Time', 'Notes', 'Payment', 'Review'];
const HOME_SERVICE_FEE = 5000;

const SERVICE_IMAGE_FALLBACKS = {
  barbering: ADMIN_IMAGE_ASSETS.categories.barbering,
  braids: ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
  'wigs-extensions': ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
  'natural-hair': ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural,
  nails: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
  makeup: ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
  'lashes-brows': ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes,
  'spa-wellness': ADMIN_IMAGE_ASSETS.categories.spaWellness,
  'bridal-events': ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
  'childrens-salon': ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
  'home-service': ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily,
};

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

function categoryIdFor(item = {}) {
  const raw = item.categoryId || item.category;
  if (!raw || typeof raw === 'string') return raw || '';
  return raw.slug || raw.code || raw.id || raw._id || '';
}

function normalizeService(item) {
  const durationMinutes = Number(item.durationMinutes || item.durationMin || 60);
  return {
    ...item,
    id: item.code || item.id || item._id,
    title: item.title || item.name || 'Beauty service',
    categoryId: categoryIdFor(item),
    tag: item.emoji || item.tag || '',
    duration: item.duration || `${durationMinutes} min`,
    durationMinutes,
    addons: item.addons || [],
  };
}

function normalizeLocation(rawLocation) {
  if (typeof rawLocation === 'string') return rawLocation;
  return [rawLocation?.city, rawLocation?.state, rawLocation?.country].filter(Boolean).join(', ');
}

function normalizeStylist(item) {
  const location = normalizeLocation(item.location || item.businessAddress || item.business || item.city);
  return {
    ...item,
    id: item.code || item.id || item._id,
    name: item.name || item.user?.name || 'Beauty professional',
    role: item.role || item.specialty || 'Beauty professional',
    avatarUrl: item.avatarUrl || item.profileImageUrl || item.photoUrl || item.user?.avatarUrl || '',
    portfolio: item.portfolio || [],
    portfolioItems: item.portfolioItems || [],
    jobs: item.jobs || item.reviewsCount || 0,
    rating: item.rating || 0,
    available: item.available !== false,
    location,
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

function offeringPrice(offering) {
  return Number(offering?.customPrice ?? offering?.price ?? offering?.displayPrice ?? 0);
}

function offeringDuration(offering, service) {
  return Number(offering?.customDuration ?? offering?.durationMinutes ?? service?.durationMinutes ?? service?.durationMin ?? 60);
}

function canBookStylistService(stylist, service) {
  const offering = offeringForService(stylist, service);
  return Boolean(stylistIsApproved(stylist) && stylist.available !== false && offering && offeringPrice(offering) > 0);
}

function startingPriceForService(service, stylists) {
  const prices = stylists
    .map(stylist => offeringPrice(offeringForService(stylist, service)))
    .filter(price => price > 0);
  return prices.length ? Math.min(...prices) : 0;
}

function serviceImage(service) {
  return service?.displayImageUrl
    || service?.primaryOffering?.imageUrl
    || service?.imageUrl
    || SERVICE_IMAGE_FALLBACKS[categoryIdFor(service)]
    || ADMIN_IMAGE_ASSETS.hero.beautyServices;
}

function stylistCover(stylist, offering, service) {
  return offering?.imageUrl
    || stylist?.coverImageUrl
    || stylist?.portfolioItems?.find(item => item.imageUrl)?.imageUrl
    || serviceImage(service);
}

function parseMinutes(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (minute > 59 || hour > (meridiem ? 12 : 23)) return null;
  if (meridiem) {
    if (hour === 12) hour = 0;
    if (meridiem === 'PM') hour += 12;
  }
  return hour * 60 + minute;
}

function isPastDate(value) {
  return Boolean(value && value < today());
}

function dateDayKey(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function isClosedDate(stylist, value) {
  return (stylist?.closedDates || []).some(item => {
    const date = item.date ? new Date(item.date) : null;
    return date && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  });
}

function scheduleForDate(stylist, value) {
  const schedules = stylist?.availability || [];
  if (!schedules.length) return null;
  const day = dateDayKey(value);
  return schedules.find(item => item.day === day && item.isAvailable !== false) || false;
}

function isDateAvailable(stylist, value) {
  if (!stylist || !value || isPastDate(value) || stylist.available === false || isClosedDate(stylist, value)) return false;
  return scheduleForDate(stylist, value) !== false;
}

function isTimeAvailable(stylist, value, time, durationMinutes) {
  if (!isDateAvailable(stylist, value)) return false;
  const start = parseMinutes(time);
  if (start === null) return false;
  if (value === today()) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (start <= currentMinutes) return false;
  }
  const schedule = scheduleForDate(stylist, value);
  if (!schedule) return true;
  const scheduleStart = parseMinutes(schedule.startTime);
  const scheduleEnd = parseMinutes(schedule.endTime);
  return scheduleStart !== null && scheduleEnd !== null && start >= scheduleStart && start + durationMinutes <= scheduleEnd;
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
  const [catalog, setCatalog] = useState({ services: [], stylists: [], branches: [] });
  const [service, setService] = useState(null);
  const [stylist, setStylist] = useState(null);
  const [location, setLocation] = useState('Salon visit');
  const [branch, setBranch] = useState('');
  const [family, setFamily] = useState('Me');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [addons, setAddons] = useState([]);
  const [promo, setPromo] = useState(nav?.offerCode || nav?.promoCode || '');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);
  const [inspImg, setInspImg] = useState(null);
  const [inspPreview, setInspPreview] = useState('');
  const [payment, setPayment] = useState('pay-salon');
  const [homeAddress, setHomeAddress] = useState('');
  const [homeArea, setHomeArea] = useState('');
  const [homeLandmark, setHomeLandmark] = useState('');
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
        const nextStylists = (stylistsRes.data || []).map(normalizeStylist).filter(stylistIsApproved);
        const nextServices = attachProviderCounts((servicesRes.data || []).map(normalizeService), nextStylists);
        const next = {
          services: nextServices,
          stylists: nextStylists,
          branches: (branchesRes.data || []).map(normalizeBranch).filter(item => item.isActive !== false),
        };
        const requestedService = next.services.find(item => item.id === nav?.serviceId || item._id === nav?.serviceId);
        const firstBookableService = next.services.find(item => item.providerCount > 0);
        const nextService = requestedService || firstBookableService || next.services[0] || null;
        const requestedStylist = next.stylists.find(item => item.id === nav?.stylistId || item._id === nav?.stylistId);
        const nextStylist = requestedStylist && nextService && canBookStylistService(requestedStylist, nextService)
          ? requestedStylist
          : null;
        setCatalog(next);
        setService(nextService);
        setStylist(nextStylist);
        setBranch(next.branches[0]?.id || '');
        setDate('');
        setTime('');
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

  useEffect(() => {
    return () => {
      if (inspPreview) URL.revokeObjectURL(inspPreview);
    };
  }, [inspPreview]);

  const selectedOffering = offeringForService(stylist, service);
  const servicePrice = offeringPrice(selectedOffering);
  const serviceDurationMinutes = selectedOffering ? offeringDuration(selectedOffering, service) : Number(service?.durationMinutes || 60);
  const serviceDuration = selectedOffering ? `${serviceDurationMinutes} min` : service?.duration || '';
  const stylistsForService = service ? catalog.stylists.filter(item => canBookStylistService(item, service)) : [];
  const effectiveBranch = catalog.branches.some(item => item.id === branch) ? branch : catalog.branches[0]?.id || '';
  const selectedBranch = catalog.branches.find(b => b.id === effectiveBranch);
  const hasPricedStylistService = Boolean(stylist && selectedOffering && servicePrice > 0);
  const travel = hasPricedStylistService && location === 'Home service' ? HOME_SERVICE_FEE : 0;
  const publicDescription = selectedOffering?.description || service?.shortDescription || service?.description || '';
  const publicImage = selectedOffering?.imageUrl || serviceImage(service);
  const addonsTotal = hasPricedStylistService ? addons.reduce((sum, addon) => sum + addonPrice(addon), 0) : 0;
  const subtotal = hasPricedStylistService ? servicePrice + travel + addonsTotal : 0;
  const discount = offerDiscount(promoApplied, subtotal);
  const total = subtotal - discount;
  const availableTimes = stylist && date && selectedOffering
    ? TIMES.filter(slot => isTimeAvailable(stylist, date, slot, serviceDurationMinutes))
    : [];
  const todayAvailable = stylist && selectedOffering && TIMES.some(slot => isTimeAvailable(stylist, today(), slot, serviceDurationMinutes));

  if (catalogLoading) {
    return (
      <div className="booking-page-shell">
        <section className="booking-hero compact">
          <span className="eyebrow"><CalendarDays size={14} /> Booking</span>
          <h1>Book appointment</h1>
          <p>Loading live services, stylists and branches.</p>
        </section>
        <div className="empty-state"><span>⌛</span><h3>Loading booking catalog</h3><p>Fetching current services and verified professionals from the backend.</p></div>
      </div>
    );
  }

  if (catalogError || !service) {
    return (
      <div className="booking-page-shell">
        <section className="booking-hero compact">
          <span className="eyebrow"><CalendarDays size={14} /> Booking</span>
          <h1>Book appointment</h1>
          <p>Choose your service, stylist, date, time and location.</p>
        </section>
        <div className="empty-state">
          <span>{catalogError ? '⚠' : '✦'}</span>
          <h3>{catalogError ? 'Booking catalog could not load' : 'No active services yet'}</h3>
          <p>{catalogError || 'Active services will appear here as soon as they are published.'}</p>
          <button onClick={() => setPage('services')}>View services</button>
        </div>
      </div>
    );
  }

  const missing = [];
  if (!service) missing.push('Please select a service.');
  if (service && stylistsForService.length === 0) missing.push('No stylist available for this service yet.');
  if (service && stylistsForService.length > 0 && !stylist) missing.push('Please select a stylist.');
  if (stylist && !selectedOffering) missing.push('This stylist does not offer the selected service.');
  if (stylist && selectedOffering && servicePrice <= 0) missing.push('This stylist has not added a final price yet.');
  if (!family) missing.push('Please choose who the booking is for.');
  if (!location) missing.push('Please select a service location.');
  if (location === 'Salon visit' && !effectiveBranch) missing.push('Please select a branch.');
  if (location === 'Home service' && !homeAddress.trim()) missing.push('Please enter your home service address.');
  if (location === 'Home service' && !homeArea.trim()) missing.push('Please enter your area or location.');
  if (!date) missing.push('Please choose a date.');
  if (date && isPastDate(date)) missing.push('Please choose a future date.');
  if (!time) missing.push('Please choose a time.');
  if (time && selectedOffering && !isTimeAvailable(stylist, date, time, serviceDurationMinutes)) missing.push('Please choose an available time.');
  if (!payment) missing.push('Please select a payment method.');
  if (!user && (!guest.name.trim() || !guest.phone.trim() || !guest.email.trim())) missing.push('Please add your name, phone and email.');

  const readyForReview = missing.length === 0;
  const activeProgressIndex = (() => {
    if (!service) return 0;
    if (!stylist) return 1;
    if (!family || !location || (location === 'Salon visit' && !effectiveBranch) || (location === 'Home service' && (!homeAddress.trim() || !homeArea.trim()))) return 2;
    if (!date || !time) return 3;
    if (!payment) return 5;
    return 6;
  })();

  async function applyPromo() {
    const code = promo.trim().toUpperCase();
    setPromoError('');
    setPromoApplied(null);
    if (!code) {
      setPromoError('Enter a promo code first.');
      return;
    }
    if (!hasPricedStylistService) {
      setPromoError('Choose a stylist first so GlowBelle can use that professional price.');
      return;
    }
    setPromoBusy(true);
    try {
      const response = await glowbelleApi.validateOffer(code, {
        serviceId: service?._id || service?.id || '',
        stylistId: stylist?._id || stylist?.id || '',
      });
      const offer = response.data;
      if (offer.maxUses && offer.usedCount >= offer.maxUses) throw new Error('This promo code has reached its usage limit.');
      if (offer.minSpend && subtotal < offer.minSpend) throw new Error(`Minimum spend for this promo is ${money(offer.minSpend)}.`);
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

  function setInspirationFile(file) {
    if (inspPreview) URL.revokeObjectURL(inspPreview);
    setInspImg(file || null);
    setInspPreview(file ? URL.createObjectURL(file) : '');
  }

  function selectService(nextService) {
    if (!canSelectService(nextService)) return;
    setService(nextService);
    setAddons([]);
    setPromoApplied(null);
    setPromoError('');
    setTime('');
    if (!stylist || !canBookStylistService(stylist, nextService)) setStylist(null);
  }

  function selectStylist(nextStylist) {
    if (!canBookStylistService(nextStylist, service)) return;
    setStylist(nextStylist);
    setPromoApplied(null);
    setPromoError('');
    setTime('');
    if (payment !== 'pay-salon') setPayment('pay-salon');
  }

  function canSelectService(item) {
    return catalog.stylists.filter(st => canBookStylistService(st, item)).length > 0;
  }

  function reviewBooking() {
    if (!readyForReview) return;
    const formattedHomeAddress = [homeAddress, homeArea, homeLandmark].filter(Boolean).join(' · ');
    setPage('confirm', {
      service: { ...service, price: servicePrice, duration: serviceDuration, durationMinutes: serviceDurationMinutes },
      stylist,
      date,
      time,
      location,
      branch: effectiveBranch,
      branchDetails: selectedBranch,
      family,
      servicePrice,
      travel,
      subtotal,
      discount,
      total,
      payment,
      notes,
      promoCode: promoApplied?.code,
      addons,
      homeAddress: location === 'Home service' ? formattedHomeAddress : '',
      guest,
      inspirationImage: inspImg,
    });
  }

  return (
    <div className="booking-page-shell">
      <section className="booking-hero">
        <div>
          <span className="eyebrow"><CalendarDays size={14} /> Booking</span>
          <h1>Book appointment</h1>
          <p>Choose your service, stylist, date, time and location.</p>
        </div>
        <div className="booking-hero-card">
          <strong>Direct professional booking</strong>
          <span>Prices come from the stylist service you select.</span>
        </div>
      </section>

      <nav className="booking-progress" aria-label="Booking progress">
        {PROGRESS_STEPS.map((label, index) => (
          <span key={label} className={index < activeProgressIndex ? 'done' : index === activeProgressIndex ? 'active' : ''}>
            <b>{index + 1}</b>{label}
          </span>
        ))}
      </nav>

      <div className="booking-layout">
        <div className="booking-main">
          <Step n="1" title="Select service">
            <div className="booking-service-grid">
              {catalog.services.map(item => {
                const providerCount = catalog.stylists.filter(st => canBookStylistService(st, item)).length;
                const startingPrice = startingPriceForService(item, catalog.stylists);
                const selected = service?.id === item.id;
                const disabled = providerCount === 0;
                return (
                  <button
                    className={selected ? 'booking-service-option selected' : disabled ? 'booking-service-option disabled' : 'booking-service-option'}
                    disabled={disabled}
                    onClick={() => selectService(item)}
                    key={item.id}
                  >
                    <span className="service-option-image"><img src={assetUrl(serviceImage(item))} alt="" loading="lazy" /></span>
                    <span className="service-option-copy">
                      <strong>{item.title}</strong>
                      <small>{providerCount > 0 ? `${providerCount} professional${providerCount === 1 ? '' : 's'} available` : 'Coming soon'}</small>
                      <em>{startingPrice > 0 ? `From ${money(startingPrice)}` : 'No stylist price yet'}</em>
                    </span>
                    {selected && <CheckCircle2 size={18} />}
                  </button>
                );
              })}
            </div>
          </Step>

          <Step n="2" title="Choose stylist">
            <div className="booking-section-head">
              <p>{stylistsForService.length === 1 ? '1 professional available for this service' : `${stylistsForService.length} professionals available for this service`}</p>
            </div>
            {stylistsForService.length > 0 ? (
              <div className={stylistsForService.length === 1 ? 'booking-stylist-grid single' : 'booking-stylist-grid'}>
                {stylistsForService.map(st => {
                  const stOffering = offeringForService(st, service);
                  const selected = stylist?.id === st.id;
                  const duration = offeringDuration(stOffering, service);
                  return (
                    <button key={st.id} className={selected ? 'booking-stylist-card selected' : 'booking-stylist-card'} onClick={() => selectStylist(st)}>
                      <img className="booking-stylist-cover" src={assetUrl(stylistCover(st, stOffering, service))} alt={`${st.name} portfolio preview`} loading="lazy" />
                      <span className="booking-stylist-selected">{selected ? <CheckCircle2 size={17} /> : 'Select'}</span>
                      <span className="booking-stylist-profile">
                        <Avatar name={st.name} src={st.avatarUrl} size={58} />
                        <span>
                          <strong>{st.name}</strong>
                          <small>{st.role}</small>
                        </span>
                      </span>
                      <span className="booking-stylist-meta">
                        <small><Star size={13} /> {stylistRatingText(st)}</small>
                        <small><MapPin size={13} /> {st.location || 'Location not added yet'}</small>
                        <small><Clock size={13} /> {duration} estimated</small>
                      </span>
                      <span className="booking-stylist-footer">
                        <b>{money(offeringPrice(stOffering))}</b>
                        <small><BadgeCheck size={13} /> Verified</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state booking-empty-state">
                <span><UserRound size={34} /></span>
                <h3>No stylist available for this service yet</h3>
                <p>Try another service or check again later.</p>
                <button onClick={() => setPage('services')}>Browse Services</button>
              </div>
            )}
          </Step>

          {hasPricedStylistService && service.addons?.length > 0 && (
            <Step n="2b" title="Optional add-ons">
              <div className="chip-list">
                {service.addons.map(addon => (
                  <button key={addonLabel(addon)} className={addons.includes(addon) ? 'chip selected' : 'chip'} onClick={() => toggleAddon(addon)}>
                    {addonLabel(addon)}
                  </button>
                ))}
              </div>
            </Step>
          )}

          <Step n="3" title="For whom & location">
            <label className="field-label">Booking for</label>
            <div className="booking-choice-grid">
              {BOOKING_FOR_OPTIONS.map(option => (
                <button key={option} className={family === option ? 'choice-card selected' : 'choice-card'} onClick={() => setFamily(option)}>
                  <UserRound size={17} />
                  <span>{option}</span>
                </button>
              ))}
            </div>

            <label className="field-label booking-location-label">Service location</label>
            <div className="booking-choice-grid two">
              <button className={location === 'Salon visit' ? 'choice-card selected' : 'choice-card'} onClick={() => setLocation('Salon visit')}>
                <MapPin size={18} />
                <span>Salon visit<small>Visit an available branch.</small></span>
              </button>
              <button className={location === 'Home service' ? 'choice-card selected' : 'choice-card'} onClick={() => setLocation('Home service')}>
                <Home size={18} />
                <span>Home service<small>{money(HOME_SERVICE_FEE)} travel fee.</small></span>
              </button>
            </div>

            {location === 'Salon visit' && (
              <div className="booking-location-panel">
                <label className="field-label">Select branch</label>
                {catalog.branches.length ? (
                  <>
                    <select value={effectiveBranch} onChange={e => setBranch(e.target.value)}>
                      {catalog.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    {selectedBranch && (
                      <div className="branch-info"><MapPin size={14} /> {selectedBranch.address} · {selectedBranch.phone}</div>
                    )}
                  </>
                ) : (
                  <div className="note-box prep">No branch available for this stylist.</div>
                )}
              </div>
            )}

            {location === 'Home service' && (
              <div className="booking-location-panel home">
                <div className="two-col">
                  <div>
                    <label className="field-label">Street address</label>
                    <input placeholder="House number and street" value={homeAddress} onChange={e => setHomeAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Area / location</label>
                    <input placeholder="Area, city or estate" value={homeArea} onChange={e => setHomeArea(e.target.value)} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label className="field-label">Landmark (optional)</label>
                  <input placeholder="Nearest landmark" value={homeLandmark} onChange={e => setHomeLandmark(e.target.value)} />
                </div>
                <div className="note-box prep">Home service fee: {money(HOME_SERVICE_FEE)}. The stylist will confirm arrival details after accepting the booking.</div>
              </div>
            )}
          </Step>

          <Step n="4" title="Date & time">
            <div className="two-col">
              <div>
                <label className="field-label">Preferred date</label>
                <input type="date" value={date} onChange={e => { setDate(e.target.value); setTime(''); }} min={today()} />
              </div>
              <div>
                <label className="field-label">Selected time</label>
                <div className="selected-time-display">{time || 'Choose a time below'}</div>
              </div>
            </div>
            {todayAvailable && <div className="availability-note"><CheckCircle2 size={15} /> Available today</div>}
            <div className="time-slots booking-time-slots">
              {TIMES.map(t => {
                const disabled = !stylist || !date || !selectedOffering || !isTimeAvailable(stylist, date, t, serviceDurationMinutes);
                return (
                  <button key={t} disabled={disabled} className={time === t ? 'time-slot active' : 'time-slot'} onClick={() => setTime(t)}>{t}</button>
                );
              })}
            </div>
            {stylist && date && selectedOffering && availableTimes.length === 0 && (
              <div className="note-box prep" style={{ marginTop: 12 }}>No available times for this date. Choose another date.</div>
            )}
          </Step>

          <Step n="5" title="Notes & inspiration">
            <label className="field-label">Special notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add hair type, allergies, preferred style, length, colour, or special requests." />
            <div style={{ marginTop: 12 }}>
              <label className="field-label">Upload inspiration photo (optional)</label>
              <div className="upload-zone booking-upload-zone" onClick={() => document.getElementById('insp-file').click()}>
                {inspPreview ? (
                  <span className="inspiration-preview" onClick={event => event.stopPropagation()}>
                    <img src={inspPreview} alt="Selected inspiration preview" />
                    <span>{inspImg?.name}</span>
                    <button type="button" onClick={() => setInspirationFile(null)} aria-label="Remove inspiration photo"><X size={15} /></button>
                  </span>
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Upload JPG, PNG or WEBP inspiration photo. Max 5MB.</span>
                  </>
                )}
                <input id="insp-file" type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => setInspirationFile(e.target.files[0] || null)} />
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
                  <input value={guest.phone} onChange={e => setGuest({ ...guest, phone: e.target.value })} placeholder="Phone or WhatsApp number" />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label className="field-label">Email</label>
                <input type="email" value={guest.email} onChange={e => setGuest({ ...guest, email: e.target.value })} placeholder="Email for confirmation" />
              </div>
            </Step>
          )}

          <Step n="6" title="Payment">
            <details className="promo-details" defaultOpen={Boolean(nav?.offerCode || nav?.promoCode)}>
              <summary><Tag size={15} /> Have a promo code?</summary>
              <div className="promo-row">
                <input placeholder="Promo code" value={promo} onChange={e => setPromo(e.target.value)} style={{ flex: 1 }} />
                <button className="promo-apply" onClick={applyPromo} disabled={promoBusy}><Tag size={16} /> {promoBusy ? 'Checking...' : 'Apply'}</button>
              </div>
              {promoApplied && <div className="promo-success">Code <b>{offerSuccessText(promoApplied)}</b>.</div>}
              {promoError && <div className="promo-error"><AlertCircle size={14} /> {promoError}</div>}
            </details>

            <label className="field-label" style={{ marginTop: 16 }}>Payment method</label>
            <div className="payment-options booking-payment-options">
              <label className={payment === 'pay-salon' ? 'pay-opt active' : 'pay-opt'}>
                <input type="radio" name="payment" value="pay-salon" checked={payment === 'pay-salon'} onChange={() => setPayment('pay-salon')} style={{ display: 'none' }} />
                <CreditCard size={16} />
                <span>Pay at salon<small>Book now and pay the stylist directly after your appointment.</small></span>
              </label>
              <label className="pay-opt disabled">
                <input type="radio" name="payment" value="online" disabled style={{ display: 'none' }} />
                <CreditCard size={16} />
                <span>Online payment<small>Coming soon</small></span>
              </label>
            </div>
          </Step>
        </div>

        <aside className="summary booking-summary-card">
          <h3>Booking summary</h3>
          <div className="summary-service">
            {publicImage ? <img src={assetUrl(publicImage)} alt={service.title} /> : <span><ImageIcon size={28} /></span>}
            <div>
              <strong>{service.title}</strong>
              <p>{stylist ? stylist.name : 'Choose stylist'}</p>
              {publicDescription && <p>{publicDescription.slice(0, 95)}{publicDescription.length > 95 ? '...' : ''}</p>}
            </div>
          </div>

          <div className="booking-summary-list">
            <div><span>Service</span><b>{service.title}</b></div>
            <div><span>Stylist</span><b>{stylist?.name || 'Choose stylist'}</b></div>
            <div><span>Date</span><b>{date || 'Choose date'}</b></div>
            <div><span>Time</span><b>{time || 'Choose time'}</b></div>
            <div><span>Location</span><b>{location}</b></div>
            <div><span>{location === 'Home service' ? 'Address' : 'Branch'}</span><b>{location === 'Home service' ? (homeAddress || 'Enter address') : (selectedBranch?.name || 'Choose branch')}</b></div>
            <div><span>Notes</span><b>{notes.trim() || inspImg ? 'Added' : 'Optional'}</b></div>
            <div><span>Payment</span><b>{payment === 'pay-salon' ? 'Pay at salon' : 'Select payment'}</b></div>
          </div>

          {hasPricedStylistService ? (
            <>
              <div className="line"><span>Stylist service price</span><b>{money(servicePrice)}</b></div>
              {addons.map(a => {
                const p = addonPrice(a);
                return <div className="line" key={addonLabel(a)}><span>{addonLabel(a).split('(')[0].trim()}</span><b>{money(p)}</b></div>;
              })}
              {travel > 0 && <div className="line"><span>Home service fee</span><b>{money(travel)}</b></div>}
              {discount > 0 && <div className="line" style={{ color: 'var(--green)' }}><span>Promo ({promoApplied.code})</span><b>-{money(discount)}</b></div>}
              <div className="line total"><span>Total</span><b>{money(total)}</b></div>
            </>
          ) : (
            <div className="summary-warning">Choose a stylist to see final price.</div>
          )}

          {!readyForReview && <div className="validation-message"><AlertCircle size={15} /> {missing[0]}</div>}
          <button onClick={reviewBooking} disabled={!readyForReview}>Review & Confirm</button>
          <p className="summary-secure-note">Free cancellation up to 24 hours before. Pay directly after your appointment.</p>
        </aside>
      </div>

      <div className="mobile-booking-cta">
        <span>{hasPricedStylistService ? money(total) : 'Price after stylist'}</span>
        <button onClick={reviewBooking} disabled={!readyForReview}>{readyForReview ? 'Review Booking' : missing[0]}</button>
      </div>
    </div>
  );
}
