import { ClipboardList, Calendar, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import PageHero from './PageHero.jsx';
import { glowbelleApi } from '../api.js';
import { money } from '../utils.js';

const STATUS_COLORS = {
  confirmed: { background: 'rgba(34,197,94,.12)', color: '#16a34a' },
  pending: { background: 'rgba(245,158,11,.12)', color: '#d97706' },
  completed: { background: 'rgba(99,102,241,.12)', color: '#6366f1' },
  cancelled: { background: 'rgba(239,68,68,.12)', color: '#dc2626' },
  'no-show': { background: 'rgba(239,68,68,.12)', color: '#dc2626' },
};

function bookingTab(booking) {
  if (booking.status === 'completed') return 'completed';
  if (['cancelled', 'no-show'].includes(booking.status)) return 'cancelled';
  return 'upcoming';
}

export default function BookingsPage({ setPage }) {
  const [tab, setTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    glowbelleApi.myBookings()
      .then(response => setBookings(response.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function cancelBooking(id) {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const response = await glowbelleApi.cancelBooking(id, 'Cancelled by customer');
      setBookings(current => current.map(item => item._id === id ? response.data : item));
    } catch (err) {
      setError(err.message);
    }
  }

  const shown = bookings.filter(booking => bookingTab(booking) === tab);

  return (
    <>
      <PageHero title="My bookings" text="Manage upcoming, completed and cancelled appointments." icon={<ClipboardList />} />
      <div className="tabs">
        {[['upcoming','Upcoming'], ['completed','Completed'], ['cancelled','Cancelled']].map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            {label} <span className="tab-count">{bookings.filter(b => bookingTab(b) === id).length}</span>
          </button>
        ))}
      </div>
      {error && <div className="promo-error" style={{ maxWidth: 800, margin: '20px auto' }}>{error}</div>}
      <div className="booking-cards">
        {!loading && shown.length === 0 && (
          <div className="empty-state"><span>📋</span><h3>No {tab} bookings</h3>{tab === 'upcoming' && <button onClick={() => setPage('booking')}>Book an appointment</button>}</div>
        )}
        {shown.map(booking => (
          <div className="booking-card" key={booking._id}>
            <div>
              <h3>{booking.service?.title || 'Salon service'}</h3>
              <p>{new Date(booking.appointmentDate).toLocaleDateString()} · {booking.startTime} · {booking.locationType === 'home' ? 'Home service' : booking.branch?.name || 'Salon visit'}</p>
              <p style={{ fontSize: 13 }}>Stylist: {booking.stylist?.name || 'Any available'} · {money(booking.total)}</p>
              <span className="status" style={STATUS_COLORS[booking.status]}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
            </div>
            <div className="booking-actions">
              {bookingTab(booking) === 'upcoming' && <button className="ghost" onClick={() => cancelBooking(booking._id)}>Cancel</button>}
              {bookingTab(booking) !== 'upcoming' && <button onClick={() => setPage('booking', { serviceId: booking.service?.code })}><Plus size={14} /> Book again</button>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', padding: '16px 32px 48px' }}><button className="view-all-btn" onClick={() => setPage('booking')}><Calendar size={16} /> Book new appointment</button></div>
    </>
  );
}
