import { Mail, MapPin, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import Info from './Info.jsx';
import PageHero from './PageHero.jsx';
import { glowbelleApi } from '../api.js';

const FAQS = [
  { q: 'Can I choose my stylist?', a: 'Yes. Customers choose from approved stylists who have published services and availability.' },
  { q: 'Can a stylist join the platform?', a: 'Yes. A stylist must apply with identity, business address and workspace evidence before approval.' },
  { q: 'Who receives a booking?', a: 'The selected stylist receives the order directly. Admin keeps oversight for safety and support.' },
  { q: 'Who sets service prices?', a: 'Approved stylists set their own services, prices and durations in their business dashboard.' },
  { q: 'How are disputes handled?', a: 'Use the contact form. Admin can review reports and take action on unsafe or inaccurate businesses.' },
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  // FIX: removed <form> tag — using controlled state + onClick instead of onSubmit
  const [fields, setFields] = useState({ name: '', email: '', phone: '', topic: '', message: '' });

  function set(k, v) { setFields(f => ({ ...f, [k]: v })); }

  async function send() {
    if (!fields.name || !fields.email || !fields.message) {
      setError('Please fill in your name, email and message.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await glowbelleApi.contact(fields);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHero title="Contact GlowBelle" text="Send platform support questions, booking issues, complaints or business enquiries." icon={<MapPin />} />

      <div className="contact-layout">
        <div className="contact-cards">
          <Info icon={<Mail />} title="Support" text="Use the form to reach the platform admin." />
          <Info icon={<MapPin />} title="Business verification" text="Stylists must apply and be approved before appearing to customers." />
        </div>

        <div className="contact-form">
          <h3>Send us a message</h3>
          <input placeholder="Your full name" value={fields.name} onChange={e => set('name', e.target.value)} />
          <input placeholder="Email address for our reply" type="email" value={fields.email} onChange={e => set('email', e.target.value)} />
          <input placeholder="Phone/WhatsApp number, optional" value={fields.phone} onChange={e => set('phone', e.target.value)} />
          <select value={fields.topic} onChange={e => set('topic', e.target.value)}>
            <option value="">Choose what this message is about</option>
            <option>General enquiry</option>
            <option>Booking issue</option>
            <option>Complaint</option>
            <option>Stylist application</option>
            <option>Report a business</option>
          </select>
          <textarea placeholder="Describe the booking issue, business question, report or support request." value={fields.message} onChange={e => set('message', e.target.value)} />
          {error && <div className="promo-error">{error}</div>}
          {sent
            ? <div className="promo-success">✅ Message sent! We will reply within 24 hours.</div>
            : <button onClick={send} disabled={sending}>{sending ? 'Sending…' : 'Send Message'}</button>
          }
        </div>

        <div className="map">
          <div style={{ textAlign: 'center' }}>
            <MapPin size={32} style={{ marginBottom: 8 }} />
            <p><strong>Marketplace support</strong></p>
            <p style={{ fontSize: 14 }}>Business addresses are shown on approved stylist profiles, not as platform-owned branches.</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Frequently asked questions</h2>
        {FAQS.map((faq, i) => (
          <div key={i} className="faq-item">
            <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              {faq.q} <ChevronDown size={18} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
            </button>
            {openFaq === i && <p className="faq-a">{faq.a}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
