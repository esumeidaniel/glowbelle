import { Calendar, CheckCircle2, CreditCard, Hash, MapPin, Plus, User } from 'lucide-react';
import { money } from '../utils.js';

function bookingDateText(booking) {
  if (!booking?.appointmentDate) return 'Date pending';
  const date = new Date(booking.appointmentDate);
  if (Number.isNaN(date.getTime())) return String(booking.appointmentDate);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SuccessPage({ setPage, booking }) {
  const paymentLabel = booking?.paymentMethod === 'pay-salon' || !booking?.paymentMethod ? 'Pay at salon' : booking.paymentMethod;
  const locationLabel = booking?.locationType === 'home'
    ? booking?.homeAddress || 'Home service'
    : booking?.branch?.name || 'Salon visit';

  return (
    <div className="success">
      <div className="success-icon"><CheckCircle2 /></div>
      <h1>Booking confirmed</h1>
      <p>Your appointment request has been saved. Keep your booking reference for support or changes.</p>
      {booking && (
        <div className="success-card success-booking-card">
          <div className="success-detail"><Hash size={18} /><div>
            <strong>{booking.bookingNumber || booking._id || 'Reference pending'}</strong>
            <p>Booking reference</p>
          </div></div>
          <div className="success-detail"><Calendar size={18} /><div>
            <strong>{booking.service?.title || 'Salon service'}</strong>
            <p>{bookingDateText(booking)} · {booking.startTime || 'Time pending'}</p>
          </div></div>
          <div className="success-detail"><User size={18} /><div>
            <strong>{booking.stylist?.name || 'Selected stylist'}</strong>
            <p>{booking.stylist?.role || 'Beauty professional'}</p>
          </div></div>
          <div className="success-detail"><MapPin size={18} /><div>
            <strong>{locationLabel}</strong>
            <p>{booking.locationType === 'home' ? 'Home service' : booking.branch?.address || 'Branch visit'}</p>
          </div></div>
          <div className="success-detail"><CreditCard size={18} /><div>
            <strong>{paymentLabel}</strong>
            <p>{Number(booking.total || 0) > 0 ? `Total: ${money(booking.total)}` : 'Pay after your appointment'}</p>
          </div></div>
        </div>
      )}
      <div className="success-actions">
        <button onClick={() => setPage('bookings')}><Calendar size={16} /> View My Bookings</button>
        <button className="secondary" onClick={() => setPage('booking')}><Plus size={16} /> Book Another Service</button>
      </div>
      <button className="ghost-btn" onClick={() => setPage('home')}>Back to home</button>
    </div>
  );
}
