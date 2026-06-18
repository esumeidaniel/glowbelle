import { CheckCircle2, Calendar } from 'lucide-react';

export default function SuccessPage({ setPage, booking }) {
  return (
    <div className="success">
      <div className="success-icon"><CheckCircle2 /></div>
      <h1>Booking received</h1>
      <p>Your appointment has been saved. Keep your booking number for reference.</p>
      {booking && (
        <div className="success-card">
          <div className="success-detail"><span>✓</span><div>
            <strong>{booking.service?.title || 'Salon service'}</strong>
            <p>{new Date(booking.appointmentDate).toLocaleDateString()} · {booking.startTime}</p>
            <p>{booking.branch?.name || (booking.locationType === 'home' ? 'Home service' : 'Salon visit')} · {booking.stylist?.name || 'Any available stylist'}</p>
            <p>Booking number: {booking.bookingNumber}</p>
          </div></div>
        </div>
      )}
      <div className="success-actions"><button onClick={() => setPage('bookings')}><Calendar size={16} /> View My Bookings</button></div>
      <button className="ghost-btn" onClick={() => setPage('home')}>Back to home</button>
    </div>
  );
}
