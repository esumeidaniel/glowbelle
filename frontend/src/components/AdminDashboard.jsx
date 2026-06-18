import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Calendar, CreditCard, LayoutDashboard, Search, Scissors, Users, ShieldCheck } from 'lucide-react';
import { downloadAdminDocument, glowbelleApi } from '../api.js';
import { SERVICE_CATEGORIES, SERVICE_SUGGESTIONS, serviceCategoryLabel } from '../serviceCategories.js';
import { money } from '../utils.js';

const NAV = [
  ['overview', <LayoutDashboard size={16} />, 'Overview'],
  ['bookings', <Calendar size={16} />, 'Bookings'],
  ['customers', <Users size={16} />, 'Customers'],
  ['applications', <ShieldCheck size={16} />, 'Stylist Applications'],
  ['services', <Scissors size={16} />, 'Services'],
];

const STATUS_COL = {
  confirmed: '#16a34a', pending: '#d97706', completed: '#6366f1', cancelled: '#dc2626', 'no-show': '#64748b', paid: '#16a34a', failed: '#dc2626', refunded: '#6366f1',
};

function niceDate(value, time) {
  if (!value) return time || '-';
  return `${new Date(value).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })} · ${time || ''}`;
}

function serviceCodeFromTitle(title) {
  return String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || `service-${Date.now()}`;
}

const EMPTY_SERVICE = {
  title: '',
  category: 'hair-styling',
  emoji: '✦',
  price: '',
  minPrice: '',
  maxPrice: '',
  durationMinutes: 60,
  shortDescription: '',
  isFeatured: false,
  isActive: true,
};

export default function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);
  const [serviceBusy, setServiceBusy] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, bookingsRes, customersRes, applicationsRes, servicesRes] = await Promise.all([
        glowbelleApi.adminStats(),
        glowbelleApi.adminBookings({ status, search: searchRef.current }),
        glowbelleApi.adminCustomers({ search: searchRef.current }),
        glowbelleApi.adminStylistApplications(),
        glowbelleApi.services({ limit: 100 }),
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data || []);
      setCustomers(customersRes.data || []);
      setApplications(applicationsRes.data || []);
      setServices(servicesRes.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load admin data. Login as admin first.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const id = window.setTimeout(loadDashboard, 0);
    return () => window.clearTimeout(id);
  }, [loadDashboard]);

  async function changeBooking(id, nextStatus) {
    try {
      await glowbelleApi.updateBookingStatus(id, { status: nextStatus });
      await loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  }

  async function reviewApplication(id, decision) {
    const note = window.prompt(`Optional note for the ${decision} application:`) || '';
    try { await glowbelleApi.reviewStylistApplication(id, { decision, note }); await loadDashboard(); }
    catch (err) { alert(err.message); }
  }

  function editService(service) {
    setServiceForm({
      _id: service._id,
      code: service.code,
      title: service.title || '',
      category: service.category || 'women',
      emoji: service.emoji || '✦',
      price: service.price ?? '',
      minPrice: service.minPrice ?? service.price ?? '',
      maxPrice: service.maxPrice ?? service.price ?? '',
      durationMinutes: service.durationMinutes || 60,
      shortDescription: service.shortDescription || service.description || '',
      isFeatured: Boolean(service.isFeatured),
      isActive: service.isActive !== false,
    });
    setTab('services');
  }

  function applySuggestedService(suggestion) {
    setServiceForm(current => ({
      ...current,
      ...suggestion,
      price: String(suggestion.price),
      minPrice: String(suggestion.minPrice),
      maxPrice: String(suggestion.maxPrice),
    }));
  }

  async function saveService(event) {
    event.preventDefault();
    setServiceBusy(true);
    try {
      const payload = {
        code: serviceForm.code || serviceCodeFromTitle(serviceForm.title),
        title: serviceForm.title,
        category: serviceForm.category,
        emoji: serviceForm.emoji,
        price: Number(serviceForm.price),
        minPrice: Number(serviceForm.minPrice || serviceForm.price),
        maxPrice: Number(serviceForm.maxPrice || serviceForm.price),
        durationMinutes: Number(serviceForm.durationMinutes),
        shortDescription: serviceForm.shortDescription,
        description: serviceForm.shortDescription,
        isFeatured: Boolean(serviceForm.isFeatured),
        isActive: Boolean(serviceForm.isActive),
      };
      if (!payload.title || !payload.category || !payload.price || !payload.durationMinutes) {
        throw new Error('Title, category, default price and duration are required.');
      }
      if (payload.maxPrice < payload.minPrice) {
        throw new Error('Maximum price cannot be lower than minimum price.');
      }
      if (serviceForm._id) await glowbelleApi.updateService(serviceForm._id, payload);
      else await glowbelleApi.createService(payload);
      setServiceForm(EMPTY_SERVICE);
      await loadDashboard();
    } catch (err) {
      alert(err.message);
    } finally {
      setServiceBusy(false);
    }
  }

  async function removeService(service) {
    if (!window.confirm(`Remove "${service.title}" from customer booking pages?`)) return;
    setServiceBusy(true);
    try {
      await glowbelleApi.deleteService(service._id);
      await loadDashboard();
    } catch (err) {
      alert(err.message);
    } finally {
      setServiceBusy(false);
    }
  }

  const statCards = [
    ['Today Bookings', stats?.todayBookings ?? 0, Calendar],
    ['Completed Value', money(stats?.revenueThisMonth ?? 0), CreditCard],
    ['Active Customers', stats?.customers ?? 0, Users],
    ['Approved Stylists', stats?.approvedStylists ?? 0, Scissors],
    ['Pending Stylists', stats?.pendingStylists ?? 0, ShieldCheck],
    ['Pending Bookings', stats?.pendingBookings ?? 0, Bell],
  ];

  return (
    <div className="dashboard">
      <aside>
        <div className="brand side"><span className="logo">GB</span><span>Admin</span></div>
        {NAV.map(([id, icon, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{icon} {label}</button>)}
      </aside>

      <main>
        <div className="dash-hero admin">
          <div>
            <span className="dashboard-kicker">Platform owner controls</span>
            <h1>{NAV.find(n => n[0] === tab)?.[2]} {tab === 'overview' ? 'Dashboard' : ''}</h1>
            <p>Approve professionals, monitor bookings, protect customers and keep GlowBelle ready for public use.</p>
          </div>
          <div className="dash-hero-actions">
            <button onClick={loadDashboard}>{loading ? 'Refreshing…' : 'Refresh dashboard'}</button>
            {onLogout && <button className="staff-logout" onClick={onLogout}>Log out</button>}
          </div>
        </div>

        {error && <div className="note-box" style={{ marginBottom: 16, color: '#dc2626' }}>{error}</div>}

        {tab === 'overview' && (
          <>
            <div className="dash-cards">
              {statCards.map(([label, value, Icon]) => (
                <div className="dash-card" key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><p>{label}</p><Icon size={18} style={{ color: 'var(--brand)' }} /></div>
                  <h2>{value}</h2>
                  <span>Live marketplace metric</span>
                </div>
              ))}
            </div>
            <section className="dashboard-panel">
              <h3>Recent bookings</h3>
              {bookings.length === 0 && <div className="empty-state"><Calendar /><h3>No bookings yet</h3><p>New customer orders will appear here once bookings start coming in.</p></div>}
              {bookings.slice(0, 6).map(b => (
                <div className="dash-row" key={b._id}>
                  <div><strong>{b.customer?.name || b.guest?.name || 'Guest'}</strong><p style={{ margin: 0, fontSize: 12 }}>{b.service?.title} · {niceDate(b.appointmentDate, b.startTime)}</p></div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: (STATUS_COL[b.status] || '#64748b') + '20', color: STATUS_COL[b.status] || '#64748b' }}>{b.status}</span>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === 'bookings' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', background: 'var(--bg)' }}>
                <Search size={16} /><input placeholder="Search booking number, guest name, email or phone" value={search} onChange={e => { searchRef.current = e.target.value; setSearch(e.target.value); }} onKeyDown={e => e.key === 'Enter' && loadDashboard()} style={{ border: 'none', padding: '10px 0', background: 'transparent', width: '100%' }} />
              </label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)' }}>
                {['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no-show'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={loadDashboard}>Search</button>
            </div>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead style={{ background: 'var(--brand-light)' }}><tr>{['ID', 'Customer', 'Service', 'Stylist', 'Date/Time', 'Amount', 'Payment', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--brand)' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12 }}>{b.bookingNumber}</td>
                      <td style={{ padding: '12px 16px' }}><strong>{b.customer?.name || b.guest?.name || 'Guest'}</strong><br /><small>{b.customer?.phone || b.guest?.phone}</small></td>
                      <td style={{ padding: '12px 16px' }}>{b.service?.title}</td>
                      <td style={{ padding: '12px 16px' }}>{b.stylist?.name || 'Any'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12 }}>{niceDate(b.appointmentDate, b.startTime)}</td>
                      <td style={{ padding: '12px 16px' }}>{money(b.total)}</td>
                      <td style={{ padding: '12px 16px' }}>{b.paymentStatus}</td>
                      <td style={{ padding: '12px 16px' }}><span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 12, background: (STATUS_COL[b.status] || '#64748b') + '20', color: STATUS_COL[b.status] || '#64748b' }}>{b.status}</span></td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {b.status === 'pending' && <button onClick={() => changeBooking(b._id, 'confirmed')}>Confirm</button>}
                          {['pending', 'confirmed'].includes(b.status) && <button onClick={() => changeBooking(b._id, 'cancelled')}>Cancel</button>}
                          {b.status === 'confirmed' && <button onClick={() => changeBooking(b._id, 'completed')}>Complete</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'customers' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}><input placeholder="Search customer name, email or phone" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: 12 }} /><button onClick={loadDashboard}>Search</button></div>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead style={{ background: 'var(--brand-light)' }}><tr>{['Customer', 'Email', 'Phone', 'Spent', 'Points', 'Joined'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left' }}>{h}</th>)}</tr></thead>
                <tbody>{customers.map(c => <tr key={c._id} style={{ borderTop: '1px solid var(--border)' }}><td style={{ padding: '12px 16px' }}>{c.name}</td><td>{c.email}</td><td>{c.phone}</td><td>{money(c.totalSpent || 0)}</td><td>{c.loyaltyPoints || 0}</td><td>{new Date(c.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'applications' && (
          <div>
            <div className="note-box prep" style={{ marginBottom: 16 }}>Compare the applicant's identity, address, registration information, and workspace photo before approval. Approval immediately makes the stylist visible and bookable.</div>
            {applications.length === 0 && <div className="empty-state"><ShieldCheck /><h3>No stylist applications</h3></div>}
            {applications.map(application => <div className="booking-card" key={application._id}>
              <div>
                <h3>{application.business?.name || application.name}</h3>
                <p>{application.user?.name} · {application.user?.email} · {application.user?.phone}</p>
                <p>{application.business?.type} · {application.business?.address}, {application.business?.city}, {application.business?.state}</p>
                <p>Registration: {application.business?.registrationNumber || 'Not provided'} · Email verified: {application.user?.emailVerified ? 'Yes' : 'No'}</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="text-btn" onClick={() => downloadAdminDocument(application._id, 'id')}>View ID</button>
                  <button className="text-btn" onClick={() => downloadAdminDocument(application._id, 'address')}>View address proof</button>
                  <button className="text-btn" onClick={() => downloadAdminDocument(application._id, 'workspace')}>View workspace</button>
                </div>
                <span className="status" style={{ marginTop: 10 }}>{application.approvalStatus}</span>
                {application.reviewNote && <p>Review note: {application.reviewNote}</p>}
              </div>
              <div className="booking-actions">
                {application.approvalStatus !== 'approved' && <button onClick={() => reviewApplication(application._id, 'approved')}>Approve</button>}
                {application.approvalStatus !== 'rejected' && <button className="ghost" onClick={() => reviewApplication(application._id, 'rejected')}>Reject</button>}
                {application.approvalStatus === 'approved' && <button className="ghost" onClick={() => reviewApplication(application._id, 'suspended')}>Suspend</button>}
              </div>
            </div>)}
          </div>
        )}

        {tab === 'services' && (
          <div className="dash-grid">
            <section>
              <h3>{serviceForm._id ? 'Edit service' : 'Publish a service'}</h3>
              <div className="note-box prep" style={{ marginBottom: 12 }}>Admin job is simple: create the service option customers and stylists can choose. Stylists add their own photos, descriptions, prices and discounts.</div>
              <div className="suggestion-panel">
                <strong>Quick suggestions</strong>
                <p>Optional: tap one to prefill the form, then edit anything before publishing.</p>
                <div className="suggestion-chips">
                  {SERVICE_SUGGESTIONS.map(suggestion => <button type="button" key={suggestion.title} onClick={() => applySuggestedService(suggestion)}>{suggestion.title}</button>)}
                </div>
              </div>
              <form onSubmit={saveService} style={{ display: 'grid', gap: 12 }}>
                <div className="two-col">
                  <input required placeholder="Service title, e.g. Knotless Braids" value={serviceForm.title} onChange={e => setServiceForm(current => ({ ...current, title: e.target.value }))} />
                  <input placeholder="Emoji/icon" value={serviceForm.emoji} onChange={e => setServiceForm(current => ({ ...current, emoji: e.target.value }))} />
                </div>
                <div className="two-col">
                  <select value={serviceForm.category} onChange={e => setServiceForm(current => ({ ...current, category: e.target.value }))}>
                    {SERVICE_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <input required type="number" min="0" placeholder="Default/starting price in ₦" value={serviceForm.price} onChange={e => setServiceForm(current => ({ ...current, price: e.target.value }))} />
                </div>
                <div className="two-col">
                  <input type="number" min="0" placeholder="Minimum stylist price in ₦" value={serviceForm.minPrice} onChange={e => setServiceForm(current => ({ ...current, minPrice: e.target.value }))} />
                  <input type="number" min="0" placeholder="Maximum stylist price in ₦" value={serviceForm.maxPrice} onChange={e => setServiceForm(current => ({ ...current, maxPrice: e.target.value }))} />
                </div>
                <input required type="number" min="5" placeholder="Default duration in minutes" value={serviceForm.durationMinutes} onChange={e => setServiceForm(current => ({ ...current, durationMinutes: e.target.value }))} />
                <textarea placeholder="Short customer-facing description" value={serviceForm.shortDescription} onChange={e => setServiceForm(current => ({ ...current, shortDescription: e.target.value }))} />
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={serviceForm.isFeatured} onChange={e => setServiceForm(current => ({ ...current, isFeatured: e.target.checked }))} /> Featured on homepage</label>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={serviceForm.isActive} onChange={e => setServiceForm(current => ({ ...current, isActive: e.target.checked }))} /> Active for customers</label>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button disabled={serviceBusy}>{serviceBusy ? 'Saving...' : serviceForm._id ? 'Save service' : 'Publish service'}</button>
                  {serviceForm._id && <button type="button" className="secondary" onClick={() => setServiceForm(EMPTY_SERVICE)}>Cancel edit</button>}
                </div>
              </form>
            </section>

            <section>
              <h3>Live customer services</h3>
              {services.length === 0 && <div className="empty-state"><Scissors /><h3>No active services</h3><p>Create your first service to make booking useful for customers.</p></div>}
              {services.map(service => <div className="dash-row" key={service._id}>
                <div>
                  <strong>{service.emoji} {service.title}</strong>
                  <p style={{ margin: 0, fontSize: 12 }}>{serviceCategoryLabel(service.category)} · allowed {money(service.minPrice ?? service.price)} - {money(service.maxPrice ?? service.price)} · default {money(service.price)} · {service.durationMinutes} min {service.isFeatured ? '· Featured' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => editService(service)}>Edit</button>
                  <button onClick={() => removeService(service)}>Remove</button>
                </div>
              </div>)}
            </section>
          </div>
        )}
        {!['overview', 'bookings', 'customers', 'applications', 'services'].includes(tab) && <div className="note-box">This dashboard section is unavailable.</div>}
      </main>
    </div>
  );
}
