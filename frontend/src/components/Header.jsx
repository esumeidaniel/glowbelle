import { Menu, X, User, LogOut, ChevronDown, Calendar, LayoutDashboard, Shield } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { setToken } from '../api.js';

export default function Header({ page, setPage, user, setUser }) {
  const [open,     setOpen]     = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef(null);
  const lockedScrollY = useRef(0);
  const restoreScrollOnClose = useRef(true);

  /* Close mobile nav on resize to desktop */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1101px)');
    const handler = e => { if (e.matches) setOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* Shadow on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handler(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdown(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Lock body scroll when mobile nav open */
  useEffect(() => {
    if (!open) return undefined;

    lockedScrollY.current = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY.current}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
      window.scrollTo(0, restoreScrollOnClose.current ? lockedScrollY.current : 0);
      restoreScrollOnClose.current = true;
    };
  }, [open]);

  /* Close mobile nav with Escape */
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const customerLinks = [
    ['home', 'Home'],
    ['services', 'Services'],
    ['booking', 'Book'],
    ['offers', 'Offers'],
    ['gallery', 'Gallery'],
    ['bookings', 'My Bookings'],
    ['profile', 'Account'],
  ];
  const publicLinks = [
    ['home', 'Dashboard'],
    ['booking', 'Book'],
    ['login', 'Account'],
  ];
  const staffLinks = [['home', 'Dashboard']];
  const links = user?.role === 'customer' ? customerLinks : user ? staffLinks : publicLinks;

  function go(id) {
    if (open) restoreScrollOnClose.current = false;
    setOpen(false);
    setDropdown(false);
    if (id === 'home' && user?.role === 'admin') setPage('admin');
    else if (id === 'home' && user?.role === 'stylist') setPage('stylist');
    else setPage(id);
  }

  function logout() {
    setToken(null);
    setUser(null);
    go('home');
  }

  return (
    <>
      {/* UPGRADE: backdrop overlay for mobile nav */}
      {open && <div className="nav-backdrop" onClick={() => setOpen(false)} />}

      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <button className="brand" onClick={() => go('home')}>
          <span className="logo">GB</span>
          <span>GlowBelle</span>
        </button>

        <nav id="site-menu" className={open ? 'nav open' : 'nav'} aria-label="Main navigation">
          {links.map(([id, label]) => (
            <button
              key={id}
              className={page === id ? 'active' : ''}
              onClick={() => go(id)}
            >
              {label}
            </button>
          ))}
          {user?.role === 'customer' && <button onClick={logout}><LogOut size={14} /> Logout</button>}
          {(user?.role === 'admin' || user?.role === 'stylist') && <div className="nav-divider" />}
          {user?.role === 'admin' && <button onClick={() => go('admin')} className="nav-dash"><Shield size={13} /> Admin</button>}
          {user?.role === 'stylist' && <button onClick={() => go('stylist')} className="nav-dash"><LayoutDashboard size={13} /> Stylist</button>}
          <div className="nav-mobile-actions">
            {user?.role === 'customer' && <button onClick={() => go('booking')} className="nav-book">Book Now</button>}
          </div>
        </nav>

        <div className="header-right">
          {user ? (
            <div className="user-menu" ref={dropRef}>
              <button className="user-btn" onClick={() => setDropdown(!dropdown)}>
                <span className="avatar-sm">{user.name?.[0] ?? '?'}</span>
                <span className="user-name">{user.name?.split(' ')[0]}</span>
                <ChevronDown size={14} style={{ transform: dropdown ? 'rotate(180deg)' : 'none', transition: '.18s' }} />
              </button>
              {dropdown && (
                <div className="user-dropdown">
                  <button onClick={() => go('profile')}><User size={14} /> My Profile</button>
                  {user.role === 'customer' && <button onClick={() => go('bookings')}><Calendar size={14} /> My Bookings</button>}
                  {user.role === 'admin' && <button onClick={() => go('admin')}><Shield size={14} /> Admin Dashboard</button>}
                  {user.role === 'stylist' && <button onClick={() => go('stylist')}><LayoutDashboard size={14} /> Stylist Dashboard</button>}
                  <button onClick={logout} className="logout">
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : null}
          {user?.role === 'customer' && <button className="book-now" onClick={() => go('booking')}>Book Now</button>}
          <button
            className="hamb"
            onClick={() => {
              if (!open) restoreScrollOnClose.current = true;
              setOpen(!open);
            }}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="site-menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
