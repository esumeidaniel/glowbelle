import { Sparkles, ChevronRight, Search, CalendarCheck, BadgeCheck, BriefcaseBusiness, WalletCards, MapPin, Clock3, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import CategoryGrid from './CategoryGrid.jsx';
import SectionTitle from './SectionTitle.jsx';
import ServiceGrid from './ServiceGrid.jsx';
import Stylists from './Stylists.jsx';
import WhyChoose from './WhyChoose.jsx';
import { glowbelleApi } from '../api.js';
import { reviews, testimonials } from '../data.js';
import { attachProviderCounts } from '../marketplace.js';
import { money } from '../utils.js';

const floatingServices = ['Silk press', 'Knotless braids', 'Fade & beard', 'Bridal glam', 'Nails', 'Massage', 'Locs', 'Facials'];
const trendingLooks = ['Destination nails', 'French highlights', 'Chrome ocean pedi', 'Riviera bob', 'Soft glam', 'Fresh fade', 'Medusa lashes', 'Boho braids'];

function CustomerHomeDashboard({ user, setPage, featured, activeOffers }) {
  const firstName = user?.name?.split(' ')?.[0] || 'there';
  const previewService = featured[0];
  const nextOffer = activeOffers[0];

  return (
    <section className="customer-home">
      <div className="customer-home-hero">
        <div>
          <span className="eyebrow"><Sparkles size={14} /> Customer dashboard</span>
          <h1>Welcome back, {firstName}.</h1>
          <p>Your GlowBelle dashboard is ready. Book a service, check your appointments, or update your account in one place.</p>
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
          <p>{previewService ? `Starting around ${money(previewService.price)}. Choose a verified stylist and send the booking request.` : 'Browse live categories and choose the service you need.'}</p>
          <button onClick={() => setPage('services')}>Browse services</button>
        </article>

        <article className="customer-dashboard-card">
          <span>Account</span>
          <h3>Profile and preferences</h3>
          <p>Keep your contact details, favorites, family members and notifications organized.</p>
          <button onClick={() => setPage('profile')}>Open account</button>
        </article>

        <article className="customer-dashboard-card">
          <span>Offers</span>
          <h3>{nextOffer?.title || 'Fresh offers appear here'}</h3>
          <p>{nextOffer ? `${nextOffer.price}${nextOffer.code ? ` with code ${nextOffer.code}` : ''}.` : 'Check discounts and promotions from GlowBelle and approved professionals.'}</p>
          <button onClick={() => setPage('offers')}>View offers</button>
        </article>
      </div>
    </section>
  );
}

export default function HomePage({ setPage, user }) {
  const [featured, setFeatured] = useState([]);
  const [activeOffers, setActiveOffers] = useState([]);

  useEffect(() => {
    const id = window.setTimeout(async () => {
      try {
        const [servicesRes, offersRes] = await Promise.all([
          glowbelleApi.services({ featured: true, limit: 6 }),
          glowbelleApi.offers(),
        ]);
        const stylistsRes = await glowbelleApi.stylists({ available: true }).catch(() => ({ data: [] }));
        setFeatured(attachProviderCounts(servicesRes.data || [], stylistsRes.data || []));
        setActiveOffers((offersRes.data || []).slice(0, 3).map(offer => ({
          id: offer._id || offer.code,
          title: offer.title,
          price: offer.priceText || `${offer.discountValue}${offer.discountType === 'percent' ? '% off' : ' off'}`,
          code: offer.code,
        })));
      } catch {
        setFeatured([]);
        setActiveOffers([]);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const previewService = featured[0];

  if (user?.role === 'customer') {
    return <CustomerHomeDashboard user={user} setPage={setPage} featured={featured} activeOffers={activeOffers} />;
  }

  return (
    <>
      <section className="market-hero">
        <div className="hero-orb one" />
        <div className="hero-orb two" />
        <div className="market-hero-copy">
          <span className="pill"><Sparkles size={16} /> Beauty marketplace for customers and professionals</span>
          <h1>Find the right beauty professional. Book in minutes.</h1>
          <p>GlowBelle connects customers with verified stylists and salon businesses. Professionals publish their services, prices and availability; customers book directly.</p>

          <div className="market-search-console" aria-label="Find beauty services">
            <button onClick={() => setPage('services')}>
              <Search size={18} />
              <span><small>What</small><strong>Search services, looks, stylists</strong></span>
            </button>
            <button onClick={() => setPage('stylists')}>
              <MapPin size={18} />
              <span><small>Where</small><strong>Find verified professionals nearby</strong></span>
            </button>
            <button onClick={() => setPage('booking')}>
              <Clock3 size={18} />
              <span><small>When</small><strong>Pick date, time and stylist</strong></span>
            </button>
            <button className="console-submit" onClick={() => setPage('services')}>Search</button>
          </div>

          <div className="role-entry-grid">
            <button className="role-entry customer" onClick={() => setPage('booking')}>
              <span><Search size={18} /> I am a customer</span>
              <strong>Discover and book services</strong>
              <small>Browse verified professionals, compare prices and send your order instantly.</small>
            </button>
            <button className="role-entry business" onClick={() => setPage('stylist-apply')}>
              <span><BriefcaseBusiness size={18} /> I am a professional</span>
              <strong>Apply to grow your business</strong>
              <small>Submit verification, publish your skills and receive bookings directly.</small>
            </button>
          </div>

          <div className="actions hero-actions">
            <button onClick={() => setPage('services')}>Explore marketplace <ChevronRight size={15} /></button>
            <button className="secondary" onClick={() => setPage('login')}>Sign in</button>
          </div>

          <div className="hero-trust-rail" aria-label="GlowBelle marketplace highlights">
            <div><strong>Verified</strong><span>Professionals reviewed by admin</span></div>
            <div><strong>Direct</strong><span>Bookings go to the chosen stylist</span></div>
            <div><strong>Simple</strong><span>Pay at salon after service</span></div>
          </div>
        </div>

        <div className="market-showcase" aria-label="GlowBelle marketplace preview">
          <div className="showcase-card booking-card-preview">
            <div className="showcase-top"><span /> <span /> <span /></div>
            <div className="booking-live-badge"><BadgeCheck size={14} /> Verified pro</div>
            <h3>{previewService?.title || 'Live service preview'}</h3>
            <p>{previewService ? 'Pulled from your backend catalog' : 'Publish services from admin to fill this card'}</p>
            <div className="preview-line"><CalendarCheck size={15} /> Today · 2:30 PM</div>
            <div className="preview-line"><WalletCards size={15} /> Pay at salon</div>
            <div className="price-row"><strong>{previewService ? money(previewService.price) : 'Live price'}</strong><span>Booking sent</span></div>
          </div>
          <div className="showcase-card pro-card-preview">
            <h4>Professional dashboard</h4>
            <div className="mini-stat"><span>Orders</span><strong>Live</strong></div>
            <div className="mini-stat"><span>Services</span><strong>Admin</strong></div>
            <div className="mini-stat"><span>Payment</span><strong>At salon</strong></div>
          </div>
          <div className="showcase-schedule">
            <span>Today</span>
            <strong>3 open slots</strong>
            <small>Availability updates from stylist dashboards</small>
          </div>
          <div className="floating-chip chip-a">Verified ID</div>
          <div className="floating-chip chip-b">Direct booking</div>
          <div className="floating-chip chip-c">Custom prices</div>
        </div>
      </section>

      <section className="service-marquee" aria-label="Popular service categories">
        <div>{floatingServices.concat(floatingServices).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
      </section>

      <section className="trend-board">
        <div className="trend-copy">
          <span className="eyebrow"><TrendingUp size={14} /> What customers are looking for</span>
          <h2>Trends, services and professionals in one booking flow.</h2>
          <p>A mature beauty marketplace does more than list services. It helps customers discover ideas, compare professionals and move straight into booking.</p>
        </div>
        <div className="trend-cloud">
          {trendingLooks.map(item => <button key={item} onClick={() => setPage('services')}>{item}</button>)}
        </div>
      </section>

      <section className="market-flow-section">
        <div className="market-flow-copy">
          <span className="eyebrow"><BadgeCheck size={14} /> Simple marketplace flow</span>
          <h2>Choose a service. Compare verified professionals. Book directly.</h2>
          <p>GlowBelle keeps the customer journey clear while giving approved professionals control of their services, portfolio, prices, availability and discounts.</p>
        </div>
        <div className="market-flow-grid">
          {[
            ['01', 'Explore', 'Find services, offers and real stylist work samples.'],
            ['02', 'Choose', 'Compare profiles, prices, availability and portfolios.'],
            ['03', 'Book', 'Send the appointment request to the selected professional.'],
            ['04', 'Pay later', 'Pay the stylist directly at the salon after service.'],
          ].map(([step, title, text]) => (
            <article className="market-flow-card" key={step}>
              <span>{step}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <SectionTitle title="Choose a category" text="A marketplace for hair, grooming, beauty, spa and event styling." />
      <CategoryGrid setPage={setPage} />

      <SectionTitle title="Featured services" text="Services are loaded from your backend catalog when available." />
      {featured.length > 0
        ? <ServiceGrid items={featured} setPage={setPage} />
        : <div className="empty-state"><span>✦</span><h3>Services are being prepared</h3><p>Featured services will appear here as soon as they are published by admin.</p></div>}
      <div style={{ textAlign: 'center', padding: '0 32px 32px' }}><button className="view-all-btn" onClick={() => setPage('services')}>View all services <ChevronRight size={16} /></button></div>

      <WhyChoose />

      <section className="social-proof-showcase">
        <div className="proof-copy">
          <span className="eyebrow">Customer confidence</span>
          <h2>A beauty experience built around confidence.</h2>
          <p>Reviews, portfolio work and booking history help customers choose with confidence. GlowBelle is designed to make those trust signals clear as the marketplace grows.</p>
        </div>
        <div className="review-stack">
          {reviews.slice(0, 3).map(review => (
            <article className="review-card" key={review.id}>
              <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
              <p>{review.text}</p>
              <strong>{review.name}</strong>
              <span>{review.service} · {review.stylist}</span>
            </article>
          ))}
        </div>
        <div className="testimonial-strip">
          {testimonials.map(item => (
            <div key={item.name}>
              <p>{item.text}</p>
              <strong>{item.name}</strong>
            </div>
          ))}
        </div>
      </section>

      <SectionTitle title="Verified professionals" text="Approved stylists and beauty businesses appear here after verification." />
      <Stylists setPage={setPage} preview />
      <div style={{ textAlign: 'center', padding: '0 32px 32px' }}><button className="view-all-btn" onClick={() => setPage('stylists')}>Meet all professionals <ChevronRight size={16} /></button></div>

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
              : <div className="offer-chip"><strong>No active offers yet</strong><span>Admin or stylists can publish offers</span><code>LIVE</code></div>}
          </div>
        </div>
      </section>

      <section className="launch-cta">
        <span>✨</span>
        <h2>Customers book. Professionals grow. Admin protects trust.</h2>
        <p>This is the GlowBelle marketplace model: simple on the front, controlled and secure behind the scenes.</p>
        <div className="actions" style={{ justifyContent: 'center' }}>
          <button onClick={() => setPage('booking')}>Book a service</button>
          <button className="secondary" onClick={() => setPage('stylist-apply')}>Join as professional</button>
        </div>
      </section>
    </>
  );
}
