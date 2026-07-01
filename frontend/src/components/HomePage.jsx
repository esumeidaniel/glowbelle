import { Sparkles, ChevronRight, Search, CalendarCheck, BadgeCheck, BriefcaseBusiness, ShieldCheck, Star, Headphones, WalletCards, Camera, Scissors, Clock, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import HeroSlider from './HeroSlider.jsx';
import StylistCard from './StylistCard.jsx';
import { assetUrl, glowbelleApi } from '../api.js';
import { ADMIN_IMAGE_ASSETS, fallbackFeaturedServices, fallbackStylists, publicServicePreviews } from '../catalog.js';
import { servicesOrFallback, stylistsOrFallback } from '../marketplace.js';
import { money } from '../utils.js';

const floatingServices = ['Silk press', 'Knotless braids', 'Fade & beard', 'Bridal glam', 'Nails', 'Massage', 'Locs', 'Facials'];
const CUSTOMER_CATEGORY_PREVIEWS = [
  ['braids', 'Braids', 'Protective styles, twists and clean braid work.', ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural],
  ['barbering', 'Barbering', 'Sharp cuts, fades and beard grooming.', ADMIN_IMAGE_ASSETS.categories.barbering],
  ['nails', 'Nail Services', 'Manicures, pedicures, acrylics and nail art.', ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes],
  ['makeup', 'Makeup', 'Soft glam, bridal glam and event looks.', ADMIN_IMAGE_ASSETS.categories.nailsMakeupLashes],
  ['spa-wellness', 'Spa', 'Facials, massage and wellness treatments.', ADMIN_IMAGE_ASSETS.categories.spaWellness],
  ['wigs-extensions', 'Wig Installation', 'Installs, revamps and extension styling.', ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural],
  ['childrens-salon', 'Children Hair', 'Kids haircuts, braids and family care.', ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily],
  ['bridal-events', 'Bridal Styling', 'Hair, makeup and styling for special days.', ADMIN_IMAGE_ASSETS.categories.bridalHomeFamily],
].map(([categoryId, title, text, imageUrl]) => ({ categoryId, title, text, imageUrl }));

function bookingStatusLabel(status = 'pending') {
  return String(status).charAt(0).toUpperCase() + String(status).slice(1);
}

function bookingDateText(booking) {
  const rawDate = booking?.appointmentDate || booking?.date;
  if (!rawDate) return 'Date pending';
  return new Date(rawDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function activeBooking(bookings = []) {
  return bookings
    .filter(booking => !['completed', 'cancelled', 'no-show'].includes(booking.status))
    .sort((a, b) => new Date(a.appointmentDate || a.date || 0) - new Date(b.appointmentDate || b.date || 0))[0] || null;
}

function galleryFromStylists(stylists = []) {
  return stylists
    .flatMap(stylist => (stylist.portfolioItems || stylist.portfolio || []).map((item, index) => {
      const rawImage = typeof item === 'string' ? item : item.imageUrl || item.url || '';
      const imageUrl = /^https?:\/\//i.test(rawImage) || String(rawImage).startsWith('/') ? rawImage : '';
      return {
        id: `${stylist.id || stylist._id || stylist.name}-portfolio-${index}`,
        title: typeof item === 'string' ? `${stylist.name || 'Stylist'} portfolio` : item.title || item.label || `${stylist.name || 'Stylist'} portfolio`,
        category: typeof item === 'string' ? 'portfolio' : item.category || 'portfolio',
        imageUrl,
        stylistName: stylist.name,
      };
    }))
    .filter(item => item.imageUrl)
    .slice(0, 6);
}

function PublicSkillPreviewSection({ setPage }) {
  return (
    <section className="public-skill-preview-section">
      <div className="public-section-head">
        <span className="eyebrow"><Sparkles size={14} /> Explore GlowBelle Services</span>
        <h2>Beauty services, shown simply.</h2>
        <p>Preview what customers will be able to book as verified stylists join GlowBelle.</p>
      </div>
      <div className="public-skill-grid">
        {publicServicePreviews().map(item => (
          <button className="public-skill-card" key={item.id} onClick={() => setPage('services', { cat: item.categoryId })}>
            <img src={assetUrl(item.imageUrl)} alt={item.title} loading="lazy" />
            <span>
              <strong>{item.title}</strong>
              <small>{item.shortDescription}</small>
              <em>Stylists coming soon</em>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function CustomerHomeDashboard({ user, setPage, featured, activeOffers, topStylists, bookings, galleryPreview }) {
  const firstName = user?.name?.split(' ')?.[0] || 'there';
  const previewService = featured[0];
  const nextOffer = activeOffers[0];
  const nextBooking = activeBooking(bookings);
  const recommendedServices = featured.filter(service => Number(service.providerCount || 0) > 0).slice(0, 4);
  const galleryItems = (galleryPreview.length ? galleryPreview : galleryFromStylists(topStylists)).slice(0, 6);

  return (
    <section className="customer-home">
      <div className="customer-home-hero">
        <div className="customer-home-hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> Customer dashboard</span>
          <h1>Welcome back, {firstName}.</h1>
          <p>Book faster, check your appointments, and jump straight into the services you care about.</p>
          <div className="customer-home-actions">
            <button onClick={() => setPage('booking')}><CalendarCheck size={16} /> Book appointment</button>
            <button className="secondary" onClick={() => setPage('services')}><Search size={16} /> Browse services</button>
          </div>
        </div>
        <div className="customer-hero-visual" aria-hidden="true">
          <img src={ADMIN_IMAGE_ASSETS.hero.beautyServices} alt="" loading="lazy" />
          <div className="customer-hero-visual-card">
            <strong>{recommendedServices.length || CUSTOMER_CATEGORY_PREVIEWS.length}</strong>
            <span>services to explore</span>
          </div>
        </div>
      </div>

      <div className="customer-action-grid">
        {[
          ['booking', CalendarCheck, 'Book Service'],
          ['bookings', Clock, 'My Bookings'],
          ['stylists', Scissors, 'Browse Stylists'],
          ['offers', Star, 'View Offers'],
        ].map(([page, Icon, label]) => (
          <button key={page} onClick={() => setPage(page)}><Icon size={16} /> {label}</button>
        ))}
      </div>

      <div className="customer-dashboard-grid">
        <article className="customer-dashboard-card highlight">
          <span>Upcoming booking</span>
          {nextBooking ? (
            <>
              <h2>{nextBooking.service?.title || 'Beauty appointment'}</h2>
              <p>{nextBooking.stylist?.name || 'Verified stylist'} · {bookingDateText(nextBooking)} · {nextBooking.startTime || nextBooking.time || 'Time pending'}</p>
              <div className="customer-booking-meta">
                <span>{bookingStatusLabel(nextBooking.status)}</span>
                <span><MapPin size={13} /> {nextBooking.locationType === 'home' ? 'Home service' : nextBooking.branch?.name || 'Salon visit'}</span>
              </div>
              <button onClick={() => setPage('bookings')}>View Booking <ChevronRight size={15} /></button>
            </>
          ) : (
            <>
              <h2>No upcoming booking yet</h2>
              <p>When you book a stylist, your appointment summary will appear here.</p>
              <button onClick={() => setPage('booking')}>Book a Service <ChevronRight size={15} /></button>
            </>
          )}
        </article>

        <article className="customer-dashboard-card">
          <span>Quick booking</span>
          <h3>{previewService?.title || 'Find your next service'}</h3>
          <p>{previewService ? `Starting around ${money(previewService.displayPrice ?? previewService.price)}. Choose a verified stylist and send the booking request.` : 'Browse live categories and choose the service you need.'}</p>
          <button onClick={() => setPage('services')}>Browse services</button>
        </article>

        <article className="customer-dashboard-card">
          <span>Profile</span>
          <h3>Your details</h3>
          <p>Update your name, phone number, family members, password and notification settings.</p>
          <button onClick={() => setPage('profile')}>View profile</button>
        </article>

        <article className="customer-dashboard-card wide">
          <span>Offers</span>
          <h3>{nextOffer?.title || 'Fresh offers appear here'}</h3>
          <p>{nextOffer ? `${nextOffer.price}${nextOffer.code ? ` with code ${nextOffer.code}` : ''}. ${nextOffer.description || 'Open the offer to see the full details.'}` : 'Check discounts and promotions from GlowBelle and approved professionals.'}</p>
          {nextOffer?.expiresAt && <small className="customer-card-note">Expires {new Date(nextOffer.expiresAt).toLocaleDateString()}</small>}
          <button onClick={() => setPage('offers')}>{nextOffer ? 'View Offer' : 'View Offers'}</button>
        </article>

        <article className="customer-dashboard-card wide">
          <span>Notifications</span>
          <h3>You're all caught up</h3>
          <p>Booking updates, stylist replies, payment notices and appointment reminders will appear here.</p>
          <button onClick={() => setPage('bookings')}>Check bookings</button>
        </article>
      </div>

      <section className="customer-service-shortcuts">
        <div className="customer-section-head">
          <div>
            <span className="eyebrow"><CalendarCheck size={14} /> Recommended services</span>
            <h2>Book from active stylist services</h2>
          </div>
          <button className="text-btn" onClick={() => setPage('services')}>View all services <ChevronRight size={15} /></button>
        </div>
        {recommendedServices.length > 0 ? (
          <div className="customer-recommended-grid">
            {recommendedServices.map(service => (
              <article className="customer-recommended-card" key={service.id || service._id || service.title}>
                <img src={assetUrl(service.displayImageUrl || service.imageUrl)} alt={service.title} loading="lazy" />
                <div>
                  <span>{service.categoryTitle || service.category || 'Service'}</span>
                  <h3>{service.title}</h3>
                  <p>{service.stylistName || 'Verified stylist'} · From {money(service.displayPrice ?? service.price)}</p>
                  <button onClick={() => setPage('booking', { serviceId: service.id || service._id })}>Book Now</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="customer-empty-panel">
            <img src={ADMIN_IMAGE_ASSETS.categories.braidsWigsNatural} alt="" loading="lazy" />
            <div>
              <h3>Recommended services will appear here</h3>
              <p>When verified stylists publish services, you will see bookable options with pricing and availability.</p>
              <button onClick={() => setPage('services')}>Explore Services</button>
            </div>
          </div>
        )}
      </section>

      <section className="customer-service-shortcuts">
        <div className="customer-section-head">
          <div>
            <span className="eyebrow"><Search size={14} /> Popular categories</span>
            <h2>Explore beauty categories</h2>
          </div>
          <button className="text-btn" onClick={() => setPage('stylists')}>View stylists <ChevronRight size={15} /></button>
        </div>
        <div className="customer-category-grid">
          {CUSTOMER_CATEGORY_PREVIEWS.map(item => (
            <article className="customer-category-card" key={item.categoryId}>
              <img src={assetUrl(item.imageUrl)} alt={item.title} loading="lazy" />
              <div>
                <span>Category</span>
                <h3>{item.title}</h3>
                <p>Browse available professionals</p>
                <button onClick={() => setPage('stylists', { cat: item.categoryId })}>View Stylists</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="customer-service-shortcuts">
        <div className="customer-section-head">
          <div>
            <span className="eyebrow"><BadgeCheck size={14} /> Top stylists</span>
            <h2>Professionals you can compare</h2>
          </div>
          <button className="text-btn" onClick={() => setPage('stylists')}>Browse stylists <ChevronRight size={15} /></button>
        </div>
        {topStylists.length > 0 ? (
          <div className="market-stylist-grid compact">
            {topStylists.slice(0, 3).map(stylist => <StylistCard key={stylist.id || stylist._id} stylist={stylist} setPage={setPage} onView={() => setPage('stylists')} />)}
          </div>
        ) : (
          <div className="customer-empty-panel">
            <img src={ADMIN_IMAGE_ASSETS.hero.marketplace} alt="" loading="lazy" />
            <div>
              <h3>Stylists are joining soon</h3>
              <p>Verified beauty professionals will appear here with portfolios, services and booking options.</p>
              <button onClick={() => setPage('stylist-apply')}>Join as a Stylist</button>
            </div>
          </div>
        )}
      </section>

      <section className="customer-service-shortcuts customer-gallery-preview-section">
        <div className="customer-section-head">
          <div>
            <span className="eyebrow"><Camera size={14} /> Gallery</span>
            <h2>Approved portfolio preview</h2>
          </div>
          <button className="text-btn" onClick={() => setPage('gallery')}>Open Gallery <ChevronRight size={15} /></button>
        </div>
        {galleryItems.length > 0 ? (
          <div className="customer-gallery-preview-grid">
            {galleryItems.map(item => (
              <button key={item.id || item.imageUrl || item.title} onClick={() => setPage('gallery')}>
                <img src={assetUrl(item.imageUrl)} alt={item.title || item.label || 'GlowBelle portfolio work'} loading="lazy" />
                <span>{item.title || item.label || item.category || 'Portfolio work'}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="customer-empty-panel">
            <img src={ADMIN_IMAGE_ASSETS.gallery.portfolioHighlight} alt="" loading="lazy" />
            <div>
              <h3>Portfolio work will appear here</h3>
              <p>Approved stylist and admin gallery images will show here once they are published.</p>
              <button onClick={() => setPage('gallery')}>Open Gallery</button>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}

export default function HomePage({ setPage, user }) {
  const [featured, setFeatured] = useState([]);
  const [activeOffers, setActiveOffers] = useState([]);
  const [topStylists, setTopStylists] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [galleryPreview, setGalleryPreview] = useState([]);

  useEffect(() => {
    const id = window.setTimeout(async () => {
      try {
        const [servicesRes, offersRes, stylistsRes, bookingsRes, galleryRes] = await Promise.all([
          glowbelleApi.services({ limit: 8, sort: 'newest' }),
          glowbelleApi.offers(),
          glowbelleApi.stylists({ available: true }).catch(() => ({ data: [] })),
          user?.role === 'customer' ? glowbelleApi.myBookings().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          user?.role === 'customer' ? glowbelleApi.gallery({ limit: 6 }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);
        setFeatured(servicesOrFallback(servicesRes.data || [], { featured: true }).filter(service => service.providerCount > 0).slice(0, 8));
        setTopStylists(stylistsOrFallback(stylistsRes.data || []).slice(0, 4));
        setBookings(bookingsRes.data || []);
        setGalleryPreview((galleryRes.data || []).map(item => ({
          id: item._id || item.id,
          title: item.title || item.label,
          category: item.category || 'portfolio',
          imageUrl: item.imageUrl || item.url || '',
        })).filter(item => item.imageUrl));
        setActiveOffers((offersRes.data || []).slice(0, 3).map(offer => ({
          id: offer._id || offer.code,
          title: offer.title,
          price: offer.priceText || `${offer.discountValue}${offer.discountType === 'percent' ? '% off' : ' off'}`,
          code: offer.code,
          description: offer.description || offer.text || '',
          expiresAt: offer.expiresAt || offer.endDate || offer.validUntil,
        })));
      } catch {
        setFeatured(fallbackFeaturedServices());
        setTopStylists(fallbackStylists().slice(0, 4));
        setActiveOffers([]);
        setBookings([]);
        setGalleryPreview([]);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [user?.role]);

  if (user?.role === 'customer') {
    return <CustomerHomeDashboard user={user} setPage={setPage} featured={featured} activeOffers={activeOffers} topStylists={topStylists} bookings={bookings} galleryPreview={galleryPreview} />;
  }

  return (
    <>
      <HeroSlider setPage={setPage} />

      <section className="marketplace-search-band">
        <div>
          <span className="eyebrow"><Search size={14} /> Find your service</span>
          <h2>Preview services by category.</h2>
        </div>
        <div className="marketplace-search-actions">
          <button onClick={() => setPage('services')}>Explore Services</button>
          <button className="secondary" onClick={() => setPage('stylist-apply')}>Join as a Stylist</button>
        </div>
      </section>

      <section className="service-marquee" aria-label="Popular service categories">
        <div>{floatingServices.concat(floatingServices).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
      </section>

      <PublicSkillPreviewSection setPage={setPage} />

      <section className="how-it-works">
        <div>
          <span className="eyebrow"><CalendarCheck size={14} /> How GlowBelle works</span>
          <h2>Choose a service. Pick a professional. Book with confidence.</h2>
        </div>
        <div className="how-grid">
          <article><Search /><strong>1. Explore</strong><p>Find hair, nails, makeup, spa, barbering and home service options.</p></article>
          <article><BadgeCheck /><strong>2. Compare</strong><p>Review profiles, portfolio work and service details when stylists go live.</p></article>
          <article><CalendarCheck /><strong>3. Book</strong><p>Choose a date and send your appointment request.</p></article>
        </div>
      </section>

      <section className="join-stylist-cta">
        <div>
          <span className="eyebrow"><BriefcaseBusiness size={14} /> For professionals</span>
          <h2>Grow your beauty business with GlowBelle</h2>
          <p>Create your profile, showcase your work, receive bookings, and manage your clients in one place.</p>
          <div className="join-benefits">
            {['Upload your portfolio', 'Choose your services', 'Set your own price', 'Manage bookings', 'Get discovered'].map(item => <span key={item}>{item}</span>)}
          </div>
        </div>
        <img className="join-stylist-image" src={ADMIN_IMAGE_ASSETS.promos.joinStylist} alt="Beauty professional workspace" loading="lazy" />
        <button onClick={() => setPage('stylist-apply')}>Join as a Stylist</button>
      </section>

      <section className="trust-section">
        {[
          [ShieldCheck, 'Verified Stylists', 'Professionals are reviewed before they go public.'],
          [WalletCards, 'Secure Booking', 'Clear service details and booking status.'],
          [Headphones, 'Customer Support', 'Help when customers or professionals need it.'],
          [BriefcaseBusiness, 'Safe Payments', 'Payment options can be enabled safely as the platform grows.'],
          [CalendarCheck, 'Easy Scheduling', 'Choose a date, time and service in a simple flow.'],
        ].map(([Icon, title, text]) => (
          <div key={title}><Icon /><strong>{title}</strong><span>{text}</span></div>
        ))}
      </section>
    </>
  );
}
