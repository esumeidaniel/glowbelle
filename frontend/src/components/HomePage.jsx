import { Sparkles, ChevronRight, Search, CalendarCheck, BadgeCheck, BriefcaseBusiness, ShieldCheck, Star, Headphones, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import CategoryGrid from './CategoryGrid.jsx';
import HeroSlider from './HeroSlider.jsx';
import SectionTitle from './SectionTitle.jsx';
import ServiceGrid from './ServiceGrid.jsx';
import StylistCard from './StylistCard.jsx';
import { glowbelleApi } from '../api.js';
import { ADMIN_IMAGE_ASSETS, fallbackFeaturedServices, fallbackStylists } from '../catalog.js';
import { servicesOrFallback, stylistsOrFallback } from '../marketplace.js';
import { money } from '../utils.js';

const floatingServices = ['Silk press', 'Knotless braids', 'Fade & beard', 'Bridal glam', 'Nails', 'Massage', 'Locs', 'Facials'];

function CustomerHomeDashboard({ user, setPage, featured, activeOffers }) {
  const firstName = user?.name?.split(' ')?.[0] || 'there';
  const previewService = featured[0];
  const nextOffer = activeOffers[0];
  const serviceShortcuts = featured.slice(0, 3);
  const fallbackShortcuts = ['Braids', 'Barbering', 'Nail Services'];

  return (
    <section className="customer-home">
      <div className="customer-home-hero">
        <div>
          <span className="eyebrow"><Sparkles size={14} /> Customer dashboard</span>
          <h1>Welcome back, {firstName}.</h1>
          <p>Book faster, check your appointments, and jump straight into the services you care about.</p>
        </div>
        <div className="customer-home-actions">
          <button onClick={() => setPage('booking')}><CalendarCheck size={16} /> Book appointment</button>
          <button className="secondary" onClick={() => setPage('services')}><Search size={16} /> Browse services</button>
        </div>
      </div>

      <div className="customer-dashboard-grid">
        <article className="customer-dashboard-card highlight">
          <span>Upcoming booking</span>
          <h2>No upcoming booking yet</h2>
          <p>When you book a stylist, your appointment summary and status will appear here.</p>
          <button onClick={() => setPage('bookings')}>Open my bookings <ChevronRight size={15} /></button>
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

        <article className="customer-dashboard-card">
          <span>Offers</span>
          <h3>{nextOffer?.title || 'Fresh offers appear here'}</h3>
          <p>{nextOffer ? `${nextOffer.price}${nextOffer.code ? ` with code ${nextOffer.code}` : ''}.` : 'Check discounts and promotions from GlowBelle and approved professionals.'}</p>
          <button onClick={() => setPage('offers')}>View offers</button>
        </article>
      </div>

      <section className="customer-service-shortcuts">
        <div className="customer-section-head">
          <div>
            <span className="eyebrow"><Search size={14} /> Popular services</span>
            <h2>Choose a service and book quickly</h2>
          </div>
          <button className="text-btn" onClick={() => setPage('services')}>View all services <ChevronRight size={15} /></button>
        </div>
        <div className="customer-shortcut-grid">
          {(serviceShortcuts.length ? serviceShortcuts : fallbackShortcuts).map(item => {
            const isService = typeof item === 'object';
            return (
              <button
                className="customer-service-shortcut"
                key={isService ? item.id || item._id || item.title : item}
                onClick={() => isService ? setPage('service-detail', { service: item, serviceId: item.id || item._id }) : setPage('services')}
              >
                <span>{isService ? item.tag || item.category || 'Service' : 'Category'}</span>
                <strong>{isService ? item.title : item}</strong>
                <small>{isService ? `${money(item.displayPrice ?? item.price)} · ${item.providerCount || 0} pro${item.providerCount === 1 ? '' : 's'}` : 'Browse available professionals'}</small>
              </button>
            );
          })}
        </div>
      </section>
    </section>
  );
}

export default function HomePage({ setPage, user }) {
  const [featured, setFeatured] = useState([]);
  const [activeOffers, setActiveOffers] = useState([]);
  const [topStylists, setTopStylists] = useState([]);

  useEffect(() => {
    const id = window.setTimeout(async () => {
      try {
        const [servicesRes, offersRes, stylistsRes] = await Promise.all([
          glowbelleApi.services({ limit: 8, sort: 'newest' }),
          glowbelleApi.offers(),
          glowbelleApi.stylists({ available: true }).catch(() => ({ data: [] })),
        ]);
        setFeatured(servicesOrFallback(servicesRes.data || [], { featured: true }).filter(service => service.providerCount > 0).slice(0, 8));
        setTopStylists(stylistsOrFallback(stylistsRes.data || []).slice(0, 4));
        setActiveOffers((offersRes.data || []).slice(0, 3).map(offer => ({
          id: offer._id || offer.code,
          title: offer.title,
          price: offer.priceText || `${offer.discountValue}${offer.discountType === 'percent' ? '% off' : ' off'}`,
          code: offer.code,
        })));
      } catch {
        setFeatured(fallbackFeaturedServices());
        setTopStylists(fallbackStylists().slice(0, 4));
        setActiveOffers([]);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  if (user?.role === 'customer') {
    return <CustomerHomeDashboard user={user} setPage={setPage} featured={featured} activeOffers={activeOffers} />;
  }

  return (
    <>
      <HeroSlider setPage={setPage} />

      <section className="marketplace-search-band">
        <div>
          <span className="eyebrow"><Search size={14} /> Find your service</span>
          <h2>Search by service, stylist, category or appointment type.</h2>
        </div>
        <div className="marketplace-search-actions">
          <button onClick={() => setPage('services')}>Browse Services</button>
          <button className="secondary" onClick={() => setPage('stylists')}>View Stylists</button>
          <button className="secondary" onClick={() => setPage('stylist-apply')}>Join as a Stylist</button>
        </div>
      </section>

      <section className="service-marquee" aria-label="Popular service categories">
        <div>{floatingServices.concat(floatingServices).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
      </section>

      <SectionTitle title="Choose a category" text="A marketplace for hair, grooming, beauty, spa and event styling." />
      <CategoryGrid setPage={setPage} />

      <SectionTitle title="Featured bookable services" text="Only services with active approved stylist offerings appear as bookable." />
      {featured.length > 0
        ? <ServiceGrid items={featured} setPage={setPage} />
        : <div className="empty-state"><span>✦</span><h3>No stylists available for this service yet.</h3><p>Featured services appear once a verified stylist selects a published admin service and activates it.</p></div>}
      <div style={{ textAlign: 'center', padding: '0 32px 32px' }}><button className="view-all-btn" onClick={() => setPage('services')}>View all services <ChevronRight size={16} /></button></div>

      <SectionTitle title="Top-rated stylists" text="Compare profiles, services, prices, portfolios and availability before you book." />
      <div className="market-stylist-grid">
        {topStylists.map(stylist => <StylistCard key={stylist.id || stylist._id} stylist={stylist} setPage={setPage} onView={() => setPage('stylists')} />)}
      </div>

      <section className="gallery-highlight-section">
        <img src={ADMIN_IMAGE_ASSETS.gallery.portfolioHighlight} alt="GlowBelle portfolio highlight" />
        <div>
          <span className="eyebrow"><BadgeCheck size={14} /> Portfolio highlights</span>
          <h2>Customers choose by real work, not guesswork.</h2>
          <p>Admin can feature approved homepage gallery images while stylists continue uploading portfolio photos and videos from their dashboards.</p>
          <button className="secondary" onClick={() => setPage('gallery')}>View Gallery</button>
        </div>
      </section>

      <section className="how-it-works">
        <div>
          <span className="eyebrow"><CalendarCheck size={14} /> How GlowBelle works</span>
          <h2>Admin builds the catalog. Stylists offer services. Customers book.</h2>
        </div>
        <div className="how-grid">
          <article><BadgeCheck /><strong>1. Pick a service</strong><p>Browse admin-published categories and active stylist offerings.</p></article>
          <article><Star /><strong>2. Choose a stylist</strong><p>Compare portfolio, rating, location, price and availability.</p></article>
          <article><WalletCards /><strong>3. Book confidently</strong><p>Send your booking request and pay at salon or as enabled by GlowBelle.</p></article>
        </div>
      </section>

      <section className="trust-section">
        {[
          [ShieldCheck, 'Verified stylists', 'Professionals are reviewed before they go public.'],
          [WalletCards, 'Secure booking', 'Clear prices, service details and booking status.'],
          [Headphones, 'Customer support', 'Help for customers, stylists and admin workflows.'],
          [BriefcaseBusiness, 'Portfolio-based choice', 'Select professionals by real approved work.'],
        ].map(([Icon, title, text]) => (
          <div key={title}><Icon /><strong>{title}</strong><span>{text}</span></div>
        ))}
      </section>

      <section className="offers-strip premium-offers">
        <div className="offers-strip-inner">
          <div>
            <span className="pill">Marketplace promotions</span>
            <h2>Live marketplace offers</h2>
            <p>Customers see real active discounts from GlowBelle and verified stylists.</p>
            <button onClick={() => setPage('offers')}>See active offers</button>
          </div>
          <div className="offer-chips">
            {activeOffers.length > 0
              ? activeOffers.map(o => <div className="offer-chip" key={o.id}><strong>{o.title}</strong><span>{o.price}</span><code>{o.code}</code></div>)
              : <div className="offer-chip"><strong>No active offers yet</strong><span>GlowBelle and stylists can publish offers</span><code>LIVE</code></div>}
          </div>
        </div>
      </section>

      <section className="join-stylist-cta">
        <div>
          <span className="eyebrow"><BriefcaseBusiness size={14} /> For professionals</span>
          <h2>Grow your beauty business with GlowBelle.</h2>
          <p>Select admin-approved services, set your prices, upload portfolio work, manage availability and receive booking requests from customers.</p>
        </div>
        <img className="join-stylist-image" src={ADMIN_IMAGE_ASSETS.promos.joinStylist} alt="" />
        <button onClick={() => setPage('stylist-apply')}>Join as a Stylist</button>
      </section>
    </>
  );
}
