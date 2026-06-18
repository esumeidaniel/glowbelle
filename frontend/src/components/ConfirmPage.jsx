import { ShieldCheck, Calendar, MapPin, User, CreditCard } from 'lucide-react';
import { useState } from 'react';
import PageHero from './PageHero.jsx';
import { money } from '../utils.js';
import { glowbelleApi } from '../api.js';

export default function ConfirmPage({ setPage, nav, user }) {
  const service = nav?.service;
  const stylist = nav?.stylist;
  const date = nav?.date || '';
  const time = nav?.time || '';
  const location = nav?.location || 'Salon visit';
  const branchId = nav?.branch || '';
  const family = nav?.family || 'Me';
  const total = nav?.total || service?.price || 0;
  const payment = nav?.payment || 'pay-salon';
  const guest = nav?.guest || {};
  const homeAddress = nav?.homeAddress || '';
  const notes = nav?.notes || '';
  const promoCode = nav?.promoCode;
  const addons = (nav?.addons || []).map(addon => {
    if (typeof addon === 'object') return { name: addon.name, price: Number(addon.price || 0) };
    const match = addon.match(/₦([\d,]+)/);
    return { name: addon.split('(')[0].trim(), price: match ? Number(match[1].replace(/,/g, '')) : 0 };
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const branch = nav?.branchDetails;

  const payLabels = { 'pay-salon': 'Pay at salon' };

  if (!service?.id) {
    return <>
      <PageHero title="Review & confirm" text="Check all details before completing your appointment." icon={<ShieldCheck />} />
      <div className="empty-state">
        <span>⚠</span>
        <h3>No booking to confirm</h3>
        <p>Please choose a live service from the booking page before confirming.</p>
        <button onClick={() => setPage('booking')}>Start booking</button>
      </div>
    </>;
  }

  async function confirm() {
    if (!agreed) return;
    setLoading(true);
    try {
      const bookingResponse = await glowbelleApi.createBooking({
        serviceId: service.id,
        stylistId: stylist?.id,
        branchId,
        locationType: location === 'Home service' || location?.startsWith('Home service') ? 'home' : 'salon',
        bookingFor: family,
        appointmentDate: date,
        startTime: time,
        paymentMethod: payment,
        guest: user ? undefined : guest,
        homeAddress,
        notes,
        promoCode,
        addons,
        inspirationImage: nav?.inspirationImage,
      });
      setPage('success', { booking: bookingResponse.data });
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero title="Review & confirm" text="Check all details before completing your appointment." icon={<ShieldCheck />} />
      <div className="confirm-card">
        <div>
          <h2>Appointment details</h2>
          <div className="confirm-detail-rows">
            <div className="conf-row"><span>{service.tag}</span><div><strong>{service.title}</strong><p>{service.duration}</p></div></div>
            <div className="conf-row"><Calendar size={18} style={{ color: 'var(--brand)' }} /><div><strong>{date}</strong><p>{time}</p></div></div>
            <div className="conf-row"><User size={18} style={{ color: 'var(--brand)' }} /><div><strong>{stylist ? stylist.name : 'Selected stylist required'}</strong><p>{stylist?.role || ''}</p></div></div>
            <div className="conf-row"><MapPin size={18} style={{ color: 'var(--brand)' }} /><div><strong>{location}</strong><p>{branch?.address || ''}</p></div></div>
            <div className="conf-row"><span>👤</span><div><strong>For: {family}</strong></div></div>
            <div className="conf-row"><CreditCard size={18} style={{ color: 'var(--brand)' }} /><div><strong>{payLabels[payment]}</strong></div></div>
            {!user && <div className="conf-row"><span>📞</span><div><strong>{guest.name || 'Guest customer'}</strong><p>{guest.phone} · {guest.email}</p></div></div>}
          </div>
        </div>

        <div className="receipt">
          <h3>Payment summary</h3>
          <div className="line"><span>Service</span><b>{money(service.price)}</b></div>
          {total !== service.price && <div className="line" style={{ color: 'var(--green)' }}><span>Savings</span><b>-{money(service.price - total)}</b></div>}
          <div className="line total"><span>Total due</span><b>{money(total)}</b></div>

          <div className="note-box prep">No online payment is taken. Pay the stylist directly at the salon or service location.</div>
          <label className="agree-check">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <span>I agree to the <b>cancellation policy</b> (free cancellation up to 24hrs before).</span>
          </label>

          <button onClick={confirm} disabled={!agreed || loading} style={{ opacity: agreed ? 1 : 0.5 }}>
            {loading ? '⏳ Confirming…' : '✅ Confirm Booking'}
          </button>
          <button className="secondary" style={{ width: '100%', marginTop: 8, padding: '11px', borderRadius: 'var(--radius-sm)', fontSize: 14, cursor: 'pointer' }} onClick={() => setPage('booking', {})}>← Edit booking</button>
        </div>
      </div>
    </>
  );
}
