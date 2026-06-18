import { useCallback, useEffect, useState } from 'react';
import { Bell, Calendar, CheckCircle2, Clock, ImagePlus, Scissors, Tag, User } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { assetUrl, glowbelleApi } from '../api.js';
import { serviceCategoryLabel } from '../serviceCategories.js';
import { money } from '../utils.js';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };
const DEFAULT_AVAILABILITY = DAYS.map(day => ({ day, startTime: '09:00', endTime: '18:00', isAvailable: !['sunday'].includes(day) }));
const NAV = [
  ['today', <Clock size={16} />, 'Today'],
  ['upcoming', <Calendar size={16} />, 'Upcoming'],
  ['completed', <CheckCircle2 size={16} />, 'Completed'],
  ['profile', <User size={16} />, 'Business Profile'],
  ['services', <Scissors size={16} />, 'Services & Prices'],
  ['discounts', <Tag size={16} />, 'Discounts'],
  ['availability', <Calendar size={16} />, 'Availability'],
  ['portfolio', <ImagePlus size={16} />, 'Portfolio'],
  ['notifications', <Bell size={16} />, 'Notifications'],
];

const EMPTY_OFFER = {
  title: '',
  code: '',
  serviceId: '',
  description: '',
  discountType: 'percent',
  discountValue: 10,
  minSpend: 0,
  maxUses: '',
  expiresAt: '',
  isActive: true,
};

function isVideoMedia(item) {
  return item?.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(item?.imageUrl || '');
}

export default function StylistDashboard({ onLogout }) {
  const [tab, setTab] = useState('today');
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [offerForm, setOfferForm] = useState(EMPTY_OFFER);
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
  const [closedDates, setClosedDates] = useState([]);
  const [closedDateForm, setClosedDateForm] = useState({ date: '', reason: '' });
  const [notifications, setNotifications] = useState({ bookingEmails: true, statusEmails: true, dailySummary: false });
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', role: '', businessName: '', bio: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const me = await glowbelleApi.me();
      setProfile(me.data.stylistProfile);
      if (me.data.stylistProfile?.approvalStatus === 'approved') {
        const stylistProfile = me.data.stylistProfile;
        const [bookingsResponse, servicesResponse, offersResponse] = await Promise.all([
          glowbelleApi.myStylistBookings(),
          glowbelleApi.services({ limit: 100 }),
          glowbelleApi.myStylistOffers(),
        ]);
        setBookings(bookingsResponse.data || []);
        setServices(servicesResponse.data || []);
        setMyOffers(offersResponse.data || []);
        setProfileForm({
          name: stylistProfile.name || '',
          role: stylistProfile.role || '',
          businessName: stylistProfile.business?.name || '',
          bio: stylistProfile.bio || '',
        });
        setOfferings((me.data.stylistProfile.offerings || []).map(item => ({
          serviceId: item.service?._id || item.service,
          price: item.price,
          durationMinutes: item.durationMinutes,
          description: item.description || '',
          imageUrl: item.imageUrl || '',
          isActive: item.isActive,
        })));
        const existingAvailability = stylistProfile.availability || [];
        setAvailability(DEFAULT_AVAILABILITY.map(defaultDay => existingAvailability.find(item => item.day === defaultDay.day) || defaultDay));
        setClosedDates((stylistProfile.closedDates || []).map(item => ({
          date: item.date ? new Date(item.date).toISOString().slice(0, 10) : '',
          reason: item.reason || '',
        })).filter(item => item.date));
        setNotifications({ bookingEmails: true, statusEmails: true, dailySummary: false, ...(stylistProfile.notificationPreferences || {}) });
        setPortfolioItems(stylistProfile.portfolioItems || []);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(load, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function updateStatus(id, status) {
    try { await glowbelleApi.updateBookingStatus(id, { status }); await load(); }
    catch (err) { setError(err.message); }
  }

  function setOffering(service, checked) {
    setOfferings(current => checked
      ? [...current, { serviceId: service._id, price: service.price, durationMinutes: service.durationMinutes, description: service.shortDescription || '', imageUrl: '', isActive: true }]
      : current.filter(item => item.serviceId !== service._id));
  }

  function updateOffering(serviceId, key, value) {
    setOfferings(current => current.map(item => item.serviceId === serviceId ? { ...item, [key]: value } : item));
  }

  async function saveOfferings() {
    setMessage(''); setError('');
    try {
      await glowbelleApi.updateMyOfferings(offerings.map(item => ({
        ...item,
        price: Number(item.price),
        durationMinutes: Number(item.durationMinutes),
      })));
      setMessage('Services and prices saved.');
      await load();
    } catch (err) { setError(err.message); }
  }

  function editOffer(offer) {
    setOfferForm({
      _id: offer._id,
      title: offer.title || '',
      code: offer.code || '',
      serviceId: offer.service?._id || offer.service || '',
      description: offer.description || '',
      discountType: offer.discountType || 'percent',
      discountValue: offer.discountValue || 10,
      minSpend: offer.minSpend || 0,
      maxUses: offer.maxUses || '',
      expiresAt: offer.expiresAt ? new Date(offer.expiresAt).toISOString().slice(0, 10) : '',
      isActive: offer.isActive !== false,
    });
    setTab('discounts');
  }

  async function saveOffer(event) {
    event.preventDefault();
    setMessage(''); setError('');
    try {
      const payload = {
        ...offerForm,
        discountValue: Number(offerForm.discountValue),
        minSpend: Number(offerForm.minSpend || 0),
        maxUses: offerForm.maxUses ? Number(offerForm.maxUses) : undefined,
        serviceId: offerForm.serviceId || undefined,
      };
      if (offerForm._id) await glowbelleApi.updateStylistOffer(offerForm._id, payload);
      else await glowbelleApi.createStylistOffer(payload);
      setOfferForm(EMPTY_OFFER);
      setMessage('Discount saved. Customers can now see it on the Offers page.');
      await load();
    } catch (err) { setError(err.message); }
  }

  async function deleteOffer(id) {
    if (!window.confirm('Remove this discount from the public Offers page?')) return;
    setMessage(''); setError('');
    try {
      await glowbelleApi.deleteStylistOffer(id);
      setMessage('Discount removed.');
      await load();
    } catch (err) { setError(err.message); }
  }

  async function saveAvailability() {
    setMessage(''); setError('');
    try {
      await glowbelleApi.updateMyStylistSettings({ availability, closedDates });
      setMessage('Availability saved. Customers can only book inside your working schedule.');
      await load();
    } catch (err) { setError(err.message); }
  }

  function updateAvailability(day, key, value) {
    setAvailability(current => current.map(item => item.day === day ? { ...item, [key]: value } : item));
  }

  function addClosedDate() {
    if (!closedDateForm.date) return;
    setClosedDates(current => [...current.filter(item => item.date !== closedDateForm.date), closedDateForm]);
    setClosedDateForm({ date: '', reason: '' });
  }

  async function saveNotifications() {
    setMessage(''); setError('');
    try {
      await glowbelleApi.updateMyStylistSettings({ notificationPreferences: notifications });
      setMessage('Notification settings saved.');
      await load();
    } catch (err) { setError(err.message); }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setMessage(''); setError('');
    try {
      await glowbelleApi.updateMyStylistSettings({
        name: profileForm.name,
        role: profileForm.role,
        bio: profileForm.bio,
        business: { name: profileForm.businessName },
      });
      setMessage('Business profile saved.');
      await load();
    } catch (err) { setError(err.message); }
  }

  async function uploadProfileImage(file) {
    if (!file) return;
    setMessage(''); setError('');
    try {
      const data = new FormData();
      data.append('image', file);
      await glowbelleApi.uploadStylistProfileImage(data);
      setMessage('Profile picture uploaded.');
      await load();
    } catch (err) { setError(err.message); }
  }

  async function uploadPortfolio(event) {
    event.preventDefault();
    if (!portfolioFile) return;
    setMessage(''); setError('');
    try {
      const data = new FormData();
      data.append('image', portfolioFile);
      data.append('title', portfolioTitle || 'Portfolio work');
      await glowbelleApi.uploadStylistPortfolio(data);
      setMessage('Portfolio media uploaded. Customers can now see it in the gallery and on your profile.');
      setPortfolioFile(null);
      setPortfolioTitle('');
      await load();
    } catch (err) { setError(err.message); }
  }

  async function deletePortfolio(index) {
    const confirmed = window.confirm('Delete this portfolio item from your profile and public gallery?');
    if (!confirmed) return;
    setMessage(''); setError('');
    try {
      await glowbelleApi.deleteStylistPortfolio(index);
      setMessage('Portfolio item deleted.');
      await load();
    } catch (err) { setError(err.message); }
  }

  async function uploadServiceImage(serviceId, file) {
    if (!file) return;
    setMessage(''); setError('');
    try {
      await glowbelleApi.updateMyOfferings(offerings.map(item => ({
        ...item,
        price: Number(item.price),
        durationMinutes: Number(item.durationMinutes),
      })));
      const data = new FormData();
      data.append('image', file);
      const response = await glowbelleApi.uploadOfferingImage(serviceId, data);
      updateOffering(serviceId, 'imageUrl', response.data.imageUrl);
      setMessage('Service image uploaded.');
    } catch (err) { setError(err.message); }
  }

  if (loading) return <div className="note-box">Loading your business account…</div>;
  if (!profile) return <div className="note-box">No stylist application is linked to this account.</div>;
  if (profile.approvalStatus !== 'approved') {
    return <div className="legal-page"><h1>Application {profile.approvalStatus}</h1><div className="note-box prep">{profile.approvalStatus === 'pending' ? 'An administrator is reviewing your identity, address, and workspace evidence. Your profile is hidden from customers until approval.' : profile.reviewNote || 'Contact support for information about this decision.'}</div></div>;
  }

  const todayKey = new Date().toDateString();
  const visible = bookings.filter(booking => {
    if (tab === 'completed') return booking.status === 'completed';
    if (tab === 'today') return new Date(booking.appointmentDate).toDateString() === todayKey && !['completed', 'cancelled'].includes(booking.status);
    return new Date(booking.appointmentDate) >= new Date() && !['completed', 'cancelled'].includes(booking.status);
  });
  const todayBookings = bookings.filter(booking => new Date(booking.appointmentDate).toDateString() === todayKey && !['completed', 'cancelled'].includes(booking.status));
  const upcomingBookings = bookings.filter(booking => new Date(booking.appointmentDate) >= new Date() && !['completed', 'cancelled'].includes(booking.status));
  const activeOfferings = offerings.filter(item => item.isActive !== false);
  const activeOfferServices = activeOfferings
    .map(item => services.find(service => service._id === item.serviceId))
    .filter(Boolean);

  return (
    <div className="dashboard">
      <aside>
        <div className="brand side"><Avatar name={profile.name} src={profile.avatarUrl} size={32} /><div><strong>{profile.name}</strong><small style={{ display: 'block' }}>{profile.business?.name}</small></div></div>
        {NAV.map(([id, icon, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{icon} {label}</button>)}
      </aside>
      <main>
        <div className="dash-hero pro">
          <div>
            <span className="dashboard-kicker">Approved professional workspace</span>
            <h1>{NAV.find(item => item[0] === tab)?.[2]}</h1>
            <p>Manage bookings, prices, availability, portfolio work, discounts and notifications from one place.</p>
          </div>
          <div className="dash-hero-actions">
            <button onClick={load}>{loading ? 'Refreshing…' : 'Refresh dashboard'}</button>
            {onLogout && <button className="staff-logout" onClick={onLogout}>Log out</button>}
          </div>
        </div>
        {error && <div className="promo-error">{error}</div>}
        {message && <div className="promo-success">{message}</div>}
        <div className="dash-cards">
          <div className="dash-card"><p>Today</p><h2>{todayBookings.length}</h2><span>Appointments due today</span></div>
          <div className="dash-card"><p>Upcoming</p><h2>{upcomingBookings.length}</h2><span>Active customer orders</span></div>
          <div className="dash-card"><p>Completed</p><h2>{bookings.filter(b => b.status === 'completed').length}</h2><span>Finished bookings</span></div>
          <div className="dash-card"><p>Services live</p><h2>{activeOfferings.length}</h2><span>Public offers enabled</span></div>
        </div>
        {tab === 'profile' && <section style={{ marginTop: 24 }}>
          <div className="note-box prep">This is the profile customers see when choosing a professional. Keep your name, store name, title, photo and bio clear.</div>
          <form onSubmit={saveProfile} className="profile-edit-form">
            <div className="profile-photo-edit">
              <Avatar name={profileForm.name || profile.name} src={profile.avatarUrl} size={96} />
              <div>
                <strong>Profile picture</strong>
                <p>Upload a clear face or brand photo. JPG, PNG or WebP up to 5MB.</p>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => uploadProfileImage(event.target.files?.[0])} />
              </div>
            </div>
            <div className="two-col">
              <input value={profileForm.name} onChange={event => setProfileForm(current => ({ ...current, name: event.target.value }))} placeholder="Display name, e.g. Amaka Obi" />
              <input value={profileForm.role} onChange={event => setProfileForm(current => ({ ...current, role: event.target.value }))} placeholder="Professional title, e.g. Bridal Specialist" />
            </div>
            <input value={profileForm.businessName} onChange={event => setProfileForm(current => ({ ...current, businessName: event.target.value }))} placeholder="Store/business name, e.g. Amaka Beauty Studio" />
            <textarea value={profileForm.bio} onChange={event => setProfileForm(current => ({ ...current, bio: event.target.value }))} placeholder="Short bio customers will read before booking you." />
            <button>Save profile</button>
          </form>
        </section>}
        {['today', 'upcoming', 'completed'].includes(tab) && <section style={{ marginTop: 24 }}>
          {visible.length === 0 && <div className="empty-state"><Calendar /><h3>No {tab} appointments</h3></div>}
          {visible.map(booking => {
            const customer = booking.customer || booking.guest || {};
            return <div className="apt-card" key={booking._id}>
              <div className="apt-time"><strong>{booking.startTime}</strong><span>{new Date(booking.appointmentDate).toLocaleDateString()}</span></div>
              <div className="apt-info"><div style={{ display: 'flex', gap: 10 }}><User size={20} /><div><strong>{customer.name || 'Customer'}</strong><p>{booking.service?.title}</p><small>{customer.phone} · {customer.email}</small></div></div>{booking.notes && <div className="note-box prep">{booking.notes}</div>}</div>
              <div className="apt-actions"><strong>{money(booking.total)}</strong><span>{booking.status}</span>{booking.status === 'pending' && <button onClick={() => updateStatus(booking._id, 'confirmed')}>Accept</button>}{booking.status === 'confirmed' && <button onClick={() => updateStatus(booking._id, 'completed')}>Complete</button>}</div>
            </div>;
          })}
        </section>}
        {tab === 'services' && <section style={{ marginTop: 24 }}>
          <div className="note-box prep">Simple launch setup: tick a service, add your price, upload one clear photo, write a short description, then save. Customers will see this photo on the service card.</div>
          {services.map(service => {
            const offering = offerings.find(item => item.serviceId === service._id);
            return <div className="dash-row stylist-offering-row" key={service._id}>
              <label className="offering-toggle"><input type="checkbox" checked={Boolean(offering)} onChange={event => setOffering(service, event.target.checked)} /><span><strong>{service.title}</strong><small>{serviceCategoryLabel(service.category)} · allowed {money(service.minPrice ?? service.price)} - {money(service.maxPrice ?? service.price)}</small></span></label>
              {offering && <div className="offering-fields">
                <input type="number" min={service.minPrice ?? 0} max={service.maxPrice ?? undefined} value={offering.price} onChange={event => updateOffering(service._id, 'price', event.target.value)} placeholder="Your price in ₦" />
                <input type="number" min="5" value={offering.durationMinutes} onChange={event => updateOffering(service._id, 'durationMinutes', event.target.value)} placeholder="Minutes" />
                <label className="mini-upload">
                  Upload service photo
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => uploadServiceImage(service._id, event.target.files?.[0])} />
                </label>
                {offering.imageUrl && <img className="offering-image-preview" src={assetUrl(offering.imageUrl)} alt={`${service.title} preview`} />}
                <textarea value={offering.description || ''} onChange={event => updateOffering(service._id, 'description', event.target.value)} placeholder="Describe how you do this service, what is included, hair length, preparation, or package details." />
              </div>}
            </div>;
          })}
          <button onClick={saveOfferings}>Save services and prices</button>
        </section>}
        {tab === 'discounts' && <section style={{ marginTop: 24 }}>
          <div className="note-box prep">Create your own promo codes for customers. A discount can apply to all your services, or only one service you currently offer.</div>
          <form onSubmit={saveOffer} className="discount-form">
            <div className="two-col">
              <input required placeholder="Discount title, e.g. Weekend braids deal" value={offerForm.title} onChange={event => setOfferForm(current => ({ ...current, title: event.target.value }))} />
              <input placeholder="Promo code, e.g. AMAKA10" value={offerForm.code} onChange={event => setOfferForm(current => ({ ...current, code: event.target.value.toUpperCase() }))} />
            </div>
            <select value={offerForm.serviceId} onChange={event => setOfferForm(current => ({ ...current, serviceId: event.target.value }))}>
              <option value="">All my services</option>
              {activeOfferServices.map(service => <option key={service._id} value={service._id}>{service.title}</option>)}
            </select>
            <textarea placeholder="Describe the offer customers will see." value={offerForm.description} onChange={event => setOfferForm(current => ({ ...current, description: event.target.value }))} />
            <div className="two-col">
              <select value={offerForm.discountType} onChange={event => setOfferForm(current => ({ ...current, discountType: event.target.value }))}>
                <option value="percent">Percentage discount</option>
                <option value="fixed">Fixed amount discount</option>
              </select>
              <input required type="number" min="1" max={offerForm.discountType === 'percent' ? 80 : undefined} value={offerForm.discountValue} onChange={event => setOfferForm(current => ({ ...current, discountValue: event.target.value }))} placeholder={offerForm.discountType === 'percent' ? 'Percent off' : 'Amount off in ₦'} />
            </div>
            <div className="two-col">
              <input type="number" min="0" value={offerForm.minSpend} onChange={event => setOfferForm(current => ({ ...current, minSpend: event.target.value }))} placeholder="Minimum spend in ₦" />
              <input type="number" min="1" value={offerForm.maxUses} onChange={event => setOfferForm(current => ({ ...current, maxUses: event.target.value }))} placeholder="Usage limit, optional" />
            </div>
            <div className="two-col">
              <input type="date" value={offerForm.expiresAt} onChange={event => setOfferForm(current => ({ ...current, expiresAt: event.target.value }))} />
              <label className="notification-row compact"><input type="checkbox" checked={offerForm.isActive} onChange={event => setOfferForm(current => ({ ...current, isActive: event.target.checked }))} /><span><strong>Active</strong><small>Show this discount to customers.</small></span></label>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button>{offerForm._id ? 'Save discount' : 'Publish discount'}</button>
              {offerForm._id && <button type="button" className="secondary" onClick={() => setOfferForm(EMPTY_OFFER)}>Cancel edit</button>}
            </div>
          </form>

          <div className="discount-list">
            {myOffers.length === 0 && <div className="empty-state"><Tag /><h3>No discounts yet</h3><p>Create a promo code when you want to market a service or fill quiet days.</p></div>}
            {myOffers.map(offer => <div className="dash-row" key={offer._id}>
              <div>
                <strong>{offer.title}</strong>
                <p style={{ margin: 0, fontSize: 12 }}>{offer.code} · {offer.discountType === 'fixed' ? money(offer.discountValue) : `${offer.discountValue}%`} off · {offer.service?.title || 'All services'} · {offer.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => editOffer(offer)}>Edit</button>
                <button className="secondary" onClick={() => deleteOffer(offer._id)}>Remove</button>
              </div>
            </div>)}
          </div>
        </section>}
        {tab === 'availability' && <section style={{ marginTop: 24 }}>
          <div className="note-box prep">Set the days and times you normally work. Customers cannot book outside these hours or on closed dates.</div>
          <div className="availability-list">
            {availability.map(item => (
              <div className="availability-row" key={item.day}>
                <label><input type="checkbox" checked={item.isAvailable} onChange={event => updateAvailability(item.day, 'isAvailable', event.target.checked)} /> {DAY_LABELS[item.day]}</label>
                <input type="time" value={item.startTime || '09:00'} disabled={!item.isAvailable} onChange={event => updateAvailability(item.day, 'startTime', event.target.value)} />
                <input type="time" value={item.endTime || '18:00'} disabled={!item.isAvailable} onChange={event => updateAvailability(item.day, 'endTime', event.target.value)} />
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: 24 }}>Closed dates</h3>
          <div className="two-col" style={{ marginTop: 10 }}>
            <input type="date" value={closedDateForm.date} onChange={event => setClosedDateForm(current => ({ ...current, date: event.target.value }))} />
            <input placeholder="Reason, e.g. personal day or holiday" value={closedDateForm.reason} onChange={event => setClosedDateForm(current => ({ ...current, reason: event.target.value }))} />
          </div>
          <button style={{ marginTop: 10 }} onClick={addClosedDate}>Add closed date</button>
          {closedDates.map(item => <div className="dash-row" key={item.date}><div><strong>{item.date}</strong><p style={{ margin: 0 }}>{item.reason || 'Closed'}</p></div><button onClick={() => setClosedDates(current => current.filter(date => date.date !== item.date))}>Remove</button></div>)}
          <button onClick={saveAvailability} style={{ marginTop: 16 }}>Save availability</button>
        </section>}
        {tab === 'portfolio' && <section style={{ marginTop: 24 }}>
          <div className="note-box prep">Upload photos or short videos of hairstyles, makeup, designs, your shop, or previous work customers can trust. These appear on your public profile and in the customer gallery.</div>
          <form onSubmit={uploadPortfolio} className="portfolio-upload-form">
            <input placeholder="Title, e.g. Bridal glam, Knotless braids, Shop tour" value={portfolioTitle} onChange={event => setPortfolioTitle(event.target.value)} />
            <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onChange={event => setPortfolioFile(event.target.files?.[0] || null)} />
            <button disabled={!portfolioFile}>Upload media</button>
          </form>
          <div className="portfolio-grid">
            {portfolioItems.length === 0 && <div className="empty-state"><ImagePlus /><h3>No portfolio media yet</h3><p>Upload a few examples of your work so customers can trust your style.</p></div>}
            {portfolioItems.map((item, index) => <div className="portfolio-card" key={`${item.imageUrl}-${index}`}>
              {isVideoMedia(item)
                ? <video src={assetUrl(item.imageUrl)} controls playsInline />
                : <img src={assetUrl(item.imageUrl)} alt={item.title || 'Portfolio work'} />}
              <div className="portfolio-card-body">
                <strong>{item.title || 'Portfolio work'}</strong>
                <button type="button" className="text-btn danger-text" onClick={() => deletePortfolio(index)}>Delete</button>
              </div>
            </div>)}
          </div>
        </section>}
        {tab === 'notifications' && <section style={{ marginTop: 24 }}>
          <div className="note-box prep">Booking email notifications are already sent when a customer books you. Choose which notifications you want to receive.</div>
          {[
            ['bookingEmails', 'New booking emails', 'Receive an email when a customer books you.'],
            ['statusEmails', 'Booking status updates', 'Receive updates when booking status changes.'],
            ['dailySummary', 'Daily summary', 'Reserved for a future daily schedule email.'],
          ].map(([key, title, text]) => (
            <label className="notification-row" key={key}>
              <input type="checkbox" checked={Boolean(notifications[key])} onChange={event => setNotifications(current => ({ ...current, [key]: event.target.checked }))} />
              <span><strong>{title}</strong><small>{text}</small></span>
            </label>
          ))}
          <button onClick={saveNotifications}>Save notifications</button>
        </section>}
      </main>
    </div>
  );
}
