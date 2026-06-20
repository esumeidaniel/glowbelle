import { ShieldCheck, Users, Heart, Sparkles } from 'lucide-react';
import PageHero from './PageHero.jsx';

export default function AboutPage({ setPage }) {
  return (
    <>
      <PageHero title="About GlowBelle" text="A beauty marketplace connecting customers with verified independent salon professionals." icon={<Heart />} />

      {/* Story */}
      <section style={{ padding: '48px 32px', maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
        <span className="pill"><Sparkles size={16} /> Marketplace model</span>
        <h2 style={{ fontSize: 32, margin: '16px 0 20px' }}>What GlowBelle does</h2>
        <p style={{ lineHeight: 1.8, color: 'var(--text)', fontSize: 16 }}>
          GlowBelle helps customers discover approved salon professionals, view their services and prices, and book appointments directly. Professionals apply with identity and business evidence before they can publish their profile.
        </p>
        <p style={{ lineHeight: 1.8, color: 'var(--text)', fontSize: 16, marginTop: 16 }}>
          The platform does not manage every appointment. GlowBelle verifies businesses, reviews reports, protects customers, and keeps the marketplace trustworthy.
        </p>
      </section>

      {/* Mission & Vision */}
      <div className="grid three" style={{ paddingBottom: 48 }}>
        {[
          { icon: <Heart />, title: 'For customers', text: 'Simple booking with approved professionals and server-verified pricing.' },
          { icon: <Sparkles />, title: 'For stylists', text: 'A business profile, custom service pricing, direct orders, portfolio and discounts.' },
          { icon: <ShieldCheck />, title: 'For trust', text: 'Business approval, private verification documents and protected access.' },
        ].map(item => (
          <div className="offer" key={item.title} style={{ textAlign: 'center', alignItems: 'center' }}>
            <div style={{ color: 'var(--brand)', marginBottom: 8 }}>{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>

      {/* Why trust us */}
      <section className="why">
        {[
          [<ShieldCheck />, 'Verification first', 'Stylists must be approved before customers can book them.'],
          [<Users />, 'Clear roles', 'Customers and professionals see only the tools meant for them.'],
          [<Heart />, 'Direct booking', 'Chosen stylists receive customer orders directly.'],
        ].map(([icon, title, text]) => (
          <div key={title} style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ color: 'var(--brand)', marginBottom: 8 }}>{icon}</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-h)' }}>{title}</h3>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text)' }}>{text}</p>
          </div>
        ))}
      </section>

      <section className="cta-section">
        <h2>Ready to book?</h2>
        <p>Choose a verified professional and send your appointment request directly.</p>
        <div className="actions" style={{ justifyContent: 'center' }}>
          <button onClick={() => setPage('booking')}>Book Appointment</button>
          <button className="secondary" onClick={() => setPage('contact')}>Contact us</button>
        </div>
      </section>
    </>
  );
}
