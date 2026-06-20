import { Sparkles, ChevronRight, Shield, Zap, Search, CalendarCheck, BadgeCheck, BriefcaseBusiness, WalletCards, SlidersHorizontal, BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';
import CategoryGrid from './CategoryGrid.jsx';
import SectionTitle from './SectionTitle.jsx';
import ServiceGrid from './ServiceGrid.jsx';
import Stylists from './Stylists.jsx';
import WhyChoose from './WhyChoose.jsx';
import { glowbelleApi } from '../api.js';
import { attachProviderCounts } from '../marketplace.js';
import { money } from '../utils.js';

const floatingServices = ['Silk press', 'Knotless braids', 'Fade & beard', 'Bridal glam', 'Nails', 'Massage', 'Locs', 'Facials'];

export default function HomePage({ setPage }) {
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

  return (
    <>
      <section className="market-hero">
        <div className="hero-orb one" />
        <div className="hero-orb two" />
        <div className="market-hero-copy">
          <span className="pill"><Sparkles size={16} /> Beauty marketplace for customers and professionals</span>
          <h1>Find the right beauty professional. Book in minutes.</h1>
          <p>GlowBelle connects customers with verified stylists and salon businesses. Professionals publish their services, prices and availability; customers book directly.</p>

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

      <section className="experience-board">
        <div className="experience-copy">
          <span className="eyebrow">A marketplace that feels personal</span>
          <h2>Everything customers need to choose with confidence.</h2>
          <p>GlowBelle is designed around service-first discovery. Customers do not need to guess who can do what: they select a category, compare verified professionals, view work samples, and book directly.</p>
        </div>
        <div className="experience-panels">
          <article className="experience-panel feature">
            <span>01</span>
            <h3>Search by service, stylist, or location</h3>
            <p>Customers can move from a service category to the right professional without confusion.</p>
          </article>
          <article className="experience-panel">
            <span>02</span>
            <h3>Profiles carry the trust</h3>
            <p>Verified badge, portfolio, availability, prices, reviews, and business details sit together.</p>
          </article>
          <article className="experience-panel">
            <span>03</span>
            <h3>Stylists manage their own business</h3>
            <p>Professionals control services, pricing, schedules, gallery posts, and discounts after approval.</p>
          </article>
        </div>
      </section>

      <section className="split-feature-section">
        <div className="split-feature-card dark">
          <span className="eyebrow">For customers</span>
          <h2>Book without calling around.</h2>
          <p>Search services, pick a verified professional, choose your time and send the appointment request straight to the stylist.</p>
          <ul>
            <li><BadgeCheck size={16} /> Approved professionals only</li>
            <li><SlidersHorizontal size={16} /> Services and prices shown clearly</li>
            <li><BellRing size={16} /> Booking notifications sent instantly</li>
          </ul>
          <button onClick={() => setPage('booking')}>Start booking</button>
        </div>
        <div className="split-feature-card light">
          <span className="eyebrow">For professionals</span>
          <h2>Run your beauty business online.</h2>
          <p>After admin approval, stylists control their public profile, service menu, prices, bookings, portfolio and discounts.</p>
          <ul>
            <li><Shield size={16} /> Verification builds customer trust</li>
            <li><Zap size={16} /> Direct orders without admin approval</li>
            <li><WalletCards size={16} /> Customers pay directly at the salon</li>
          </ul>
          <button onClick={() => setPage('stylist-apply')}>Apply as professional</button>
        </div>
      </section>

      <div className="proof-strip upgraded">
        {[
          ['Verified', 'Business approval before public listing'],
          ['Direct', 'Customers book the chosen professional'],
          ['Flexible', 'Professional controls prices and services'],
          ['Secure', 'Role-based dashboards and protected data'],
        ].map(([val, label]) => <div className="proof-item" key={label}><strong>{val}</strong><span>{label}</span></div>)}
      </div>

      <SectionTitle title="Choose a category" text="A marketplace for hair, grooming, beauty, spa and event styling." />
      <CategoryGrid setPage={setPage} />

      <SectionTitle title="Featured services" text="Services are loaded from your backend catalog when available." />
      {featured.length > 0
        ? <ServiceGrid items={featured} setPage={setPage} />
        : <div className="empty-state"><span>✦</span><h3>Services are being prepared</h3><p>Featured services will appear here as soon as they are published by admin.</p></div>}
      <div style={{ textAlign: 'center', padding: '0 32px 32px' }}><button className="view-all-btn" onClick={() => setPage('services')}>View all services <ChevronRight size={16} /></button></div>

      <WhyChoose />

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
