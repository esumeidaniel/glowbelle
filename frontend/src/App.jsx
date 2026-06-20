import { useEffect, useRef, useState, useCallback } from 'react';
import AdminDashboard from './components/AdminDashboard.jsx';
import BookingPage from './components/BookingPage.jsx';
import BookingsPage from './components/BookingsPage.jsx';
import ConfirmPage from './components/ConfirmPage.jsx';
import ContactPage from './components/ContactPage.jsx';
import Footer from './components/Footer.jsx';
import GalleryPage from './components/GalleryPage.jsx';
import Header from './components/Header.jsx';
import HomePage from './components/HomePage.jsx';
import LoginPage from './components/LoginPage.jsx';
import OffersPage from './components/OffersPage.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import ServiceDetailPage from './components/ServiceDetailPage.jsx';
import ServicesPage from './components/ServicesPage.jsx';
import StylistDashboard from './components/StylistDashboard.jsx';
import StylistsPage from './components/StylistsPage.jsx';
import SuccessPage from './components/SuccessPage.jsx';
import AboutPage from './components/AboutPage.jsx';
import LegalPage from './components/LegalPage.jsx';
import StylistApplyPage from './components/StylistApplyPage.jsx';
import { glowbelleApi, setToken } from './api.js';
import { setToastHandler } from './toast.js';
import './App.css';
import './polish.css';
import './responsive.css';

const PUBLIC_PAGES = ['home', 'login', 'booking', 'stylist-apply', 'privacy', 'terms', 'cancellation', 'refund'];
const CUSTOMER_PAGES = ['home', 'services', 'service-detail', 'booking', 'bookings', 'gallery', 'offers', 'contact', 'confirm', 'success', 'stylists', 'profile', 'about', 'privacy', 'terms', 'cancellation', 'refund'];
const STAFF_COMMON_PAGES = ['profile', 'privacy', 'terms', 'cancellation', 'refund'];

function startPageFor(role) {
  if (role === 'admin') return 'admin';
  if (role === 'stylist') return 'stylist';
  return 'home';
}

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  useEffect(() => {
    setToastHandler(addToast);
    return () => setToastHandler(() => {});
  }, [addToast]);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

function MobileCustomerNav({ page, setPage, user }) {
  if (user?.role !== 'customer') return null;
  const items = [
    ['home', 'Home'],
    ['services', 'Services'],
    ['booking', 'Book'],
    ['offers', 'Offers'],
    ['gallery', 'Gallery'],
  ];
  return (
    <nav className="mobile-customer-nav" aria-label="Customer quick navigation">
      {items.map(([id, label]) => (
        <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
          <span>{label.slice(0, 1)}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const [page, setPage]   = useState('home');
  const [nav,  setNav]    = useState({});
  const [user, setUser]   = useState(null);
  const [showTop, setShowTop] = useState(false);
  const mainRef = useRef(null);

  /* ── Restore session ── */
  useEffect(() => {
    if (!localStorage.getItem('glowbelle_token')) return;
    glowbelleApi.me()
      .then(res => setUser(res.data.user))
      .catch(() => setToken(null));
  }, []);

  /* ── Scroll-to-top visibility ── */
  useEffect(() => {
    function onScroll() { setShowTop(window.scrollY > 400); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function navigate(p, data = {}) {
    const target = p === 'home' && user ? startPageFor(user.role) : p;
    setPage(target);
    setNav(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function logout() {
    setToken(null);
    setUser(null);
    setPage('home');
    setNav({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderPage() {
    if (!user && !PUBLIC_PAGES.includes(page)) {
      return <LoginPage setPage={navigate} setUser={setUser} />;
    }
    if (user?.role === 'customer' && !CUSTOMER_PAGES.includes(page)) {
      return page === 'admin' || page === 'stylist'
        ? <LoginPage setPage={navigate} setUser={setUser} />
        : <HomePage setPage={navigate} user={user} />;
    }
    if (user?.role === 'admin' && page !== 'admin' && !STAFF_COMMON_PAGES.includes(page)) return <AdminDashboard onLogout={logout} />;
    if (user?.role === 'stylist' && page !== 'stylist' && !STAFF_COMMON_PAGES.includes(page)) return <StylistDashboard onLogout={logout} />;

    switch (page) {
      case 'home':           return <HomePage          setPage={navigate} user={user} />;
      case 'services':       return <ServicesPage      setPage={navigate} nav={nav} />;
      case 'service-detail': return <ServiceDetailPage setPage={navigate} nav={nav} />;
      case 'booking':        return <BookingPage       setPage={navigate} nav={nav} user={user} />;
      case 'bookings':       return user ? <BookingsPage setPage={navigate} /> : <LoginPage setPage={navigate} setUser={setUser} />;
      case 'gallery':        return <GalleryPage       setPage={navigate} />;
      case 'offers':         return <OffersPage        setPage={navigate} />;
      case 'contact':        return <ContactPage />;
      case 'confirm':        return <ConfirmPage       setPage={navigate} nav={nav} user={user} />;
      case 'success':        return <SuccessPage       setPage={navigate} booking={nav?.booking} />;
      case 'stylists':       return <StylistsPage      setPage={navigate} />;
      case 'login':          return <LoginPage         setPage={navigate} setUser={setUser} />;
      case 'profile':        return user ? <ProfilePage setPage={navigate} user={user} setUser={setUser} /> : <LoginPage setPage={navigate} setUser={setUser} />;
      case 'about':          return <AboutPage         setPage={navigate} />;
      case 'privacy':        return <LegalPage type="privacy" />;
      case 'terms':          return <LegalPage type="terms" />;
      case 'cancellation':   return <LegalPage type="cancellation" />;
      case 'refund':         return <LegalPage type="refund" />;
      case 'admin':          return user?.role === 'admin' ? <AdminDashboard onLogout={logout} /> : <LoginPage setPage={navigate} setUser={setUser} />;
      case 'stylist':        return user?.role === 'stylist' ? <StylistDashboard onLogout={logout} /> : <LoginPage setPage={navigate} setUser={setUser} />;
      case 'stylist-apply':  return <StylistApplyPage setPage={navigate} />;
      default:               return <HomePage          setPage={navigate} user={user} />;
    }
  }

  const staffSession = user?.role === 'admin' || user?.role === 'stylist';
  if (staffSession) {
    return (
      <div className="dash-wrapper">
        <ToastContainer />
        {renderPage()}
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <Header page={page} setPage={navigate} user={user} setUser={setUser} />
      <main ref={mainRef}>{renderPage()}</main>
      <Footer setPage={navigate} user={user} />

      {/* UPGRADE: Scroll-to-top button */}
      <button
        className={`scroll-top${showTop ? ' visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        ↑
      </button>

      <MobileCustomerNav page={page} setPage={navigate} user={user} />
    </>
  );
}
