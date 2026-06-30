import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Calendar, CreditCard, ImagePlus, LayoutDashboard, Search, Scissors, Settings, UserCheck, Users, ShieldCheck, WalletCards } from 'lucide-react';
import AdminCatalogManager from './AdminCatalogManager.jsx';
import DashboardStatsCard from './DashboardStatsCard.jsx';
import { downloadAdminDocument, glowbelleApi } from '../api.js';
import { MASTER_SERVICES } from '../catalog.js';
import { money } from '../utils.js';

const NAV = [
  ['overview', <LayoutDashboard size={16} />, 'Dashboard'],
  ['users', <Users size={16} />, 'Users'],
  ['stylists', <UserCheck size={16} />, 'Stylists'],
  ['customers', <Users size={16} />, 'Customers'],
  ['services', <Scissors size={16} />, 'Service Catalog'],
  ['bookings', <Calendar size={16} />, 'Bookings'],
  ['payments', <WalletCards size={16} />, 'Payments'],
  ['applications', <ShieldCheck size={16} />, 'Image Approvals'],
  ['gallery', <ImagePlus size={16} />, 'Gallery'],
  ['settings', <Settings size={16} />, 'Settings'],
];

const STATUS_COL = {
  confirmed: '#16a34a', pending: '#d97706', completed: '#6366f1', cancelled: '#dc2626', 'no-show': '#64748b', paid: '#16a34a', failed: '#dc2626', refunded: '#6366f1',
  approved: '#16a34a', rejected: '#dc2626', suspended: '#64748b',
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
  imageUrl: '',
  price: '',
  minPrice: '',
  maxPrice: '',
  durationMinutes: 60,
  shortDescription: '',
  isFeatured: false,
  isActive: true,
};

function StatusPill({ status: value }) {
  const color = STATUS_COL[value] || '#64748b';
  return <span className="status-pill" style={{ '--status-color': color }}>{value}</span>;
}

function AdminTable({ headers, children }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function ActionGroup({ children }) {
  return <div className="action-group">{children}</div>;
}

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
      setServices(servicesRes.data?.length ? servicesRes.data : MASTER_SERVICES);
    } catch (err) {
      setServices(MASTER_SERVICES);
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
      title: service.title || service.name || '',
      category: service.category || service.categoryId || 'hair-styling',
      emoji: service.emoji || '✦',
      imageUrl: service.imageUrl || '',
      price: service.price ?? '',
      minPrice: service.minPrice ?? service.price ?? '',
      maxPrice: service.maxPrice ?? service.price ?? '',
      durationMinutes: service.durationMinutes || service.durationMin || 60,
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
        imageUrl: serviceForm.imageUrl,
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
    if (!window.confirm(`Remove "${service.title || service.name}" from customer booking pages?`)) return;
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
    ['Catalog Services', services.length, Scissors],
    ['Image Approvals', applications.filter(item => item.approvalStatus === 'pending').length, ImagePlus],
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
            <h1>{NAV.find(n => n[0] === tab)?.[2]}</h1>
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
                <DashboardStatsCard key={label} label={label} value={value} icon={Icon} helper="Live marketplace metric" />
              ))}
            </div>
            <section className="dashboard-panel">
              <h3>Recent bookings</h3>
              {bookings.length === 0 && <div className="empty-state"><Calendar /><h3>No bookings yet</h3><p>New customer orders will appear here once bookings start coming in.</p></div>}
              {bookings.slice(0, 6).map(b => (
                <div className="dash-row" key={b._id}>
                  <div><strong>{b.customer?.name || b.guest?.name || 'Guest'}</strong><p style={{ margin: 0, fontSize: 12 }}>{b.service?.title} · {niceDate(b.appointmentDate, b.startTime)}</p></div>
                  <StatusPill status={b.status} />
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
            <AdminTable headers={['ID', 'Customer', 'Service', 'Stylist', 'Date/Time', 'Amount', 'Payment', 'Status', 'Actions']}>
                  {bookings.map(b => (
                    <tr key={b._id}>
                      <td className="mono-cell">{b.bookingNumber}</td>
                      <td><strong>{b.customer?.name || b.guest?.name || 'Guest'}</strong><br /><small>{b.customer?.phone || b.guest?.phone}</small></td>
                      <td>{b.service?.title}</td>
                      <td>{b.stylist?.name || 'Any'}</td>
                      <td className="muted-cell">{niceDate(b.appointmentDate, b.startTime)}</td>
                      <td>{money(b.total)}</td>
                      <td>{b.paymentStatus}</td>
                      <td><StatusPill status={b.status} /></td>
                      <td>
                        <ActionGroup>
                          {b.status === 'pending' && <button onClick={() => changeBooking(b._id, 'confirmed')}>Confirm</button>}
                          {['pending', 'confirmed'].includes(b.status) && <button onClick={() => changeBooking(b._id, 'cancelled')}>Cancel</button>}
                          {b.status === 'confirmed' && <button onClick={() => changeBooking(b._id, 'completed')}>Complete</button>}
                        </ActionGroup>
                      </td>
                    </tr>
                  ))}
            </AdminTable>
          </div>
        )}

        {tab === 'customers' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}><input placeholder="Search customer name, email or phone" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: 12 }} /><button onClick={loadDashboard}>Search</button></div>
            <AdminTable headers={['Customer', 'Email', 'Phone', 'Spent', 'Points', 'Joined']}>
              {customers.map(c => <tr key={c._id}><td>{c.name}</td><td>{c.email}</td><td>{c.phone}</td><td>{money(c.totalSpent || 0)}</td><td>{c.loyaltyPoints || 0}</td><td>{new Date(c.createdAt).toLocaleDateString()}</td></tr>)}
            </AdminTable>
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
                <div style={{ marginTop: 10 }}><StatusPill status={application.approvalStatus} /></div>
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
          <AdminCatalogManager
            services={services}
            serviceForm={serviceForm}
            setServiceForm={setServiceForm}
            serviceBusy={serviceBusy}
            saveService={saveService}
            editService={editService}
            removeService={removeService}
            applySuggestedService={applySuggestedService}
            resetService={() => setServiceForm(EMPTY_SERVICE)}
          />
        )}
        {['users', 'stylists', 'payments', 'gallery', 'settings'].includes(tab) && <div className="dashboard-panel"><h3>{NAV.find(n => n[0] === tab)?.[2]}</h3><p>This frontend section is ready for the matching backend endpoint. Use Service Catalog, Bookings, Customers and Image Approvals for the active launch controls.</p></div>}
        {!['overview', 'bookings', 'customers', 'applications', 'services', 'users', 'stylists', 'payments', 'gallery', 'settings'].includes(tab) && <div className="note-box">This dashboard section is unavailable.</div>}
      </main>
    </div>
  );
}
