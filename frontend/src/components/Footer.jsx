import { Camera, Users, MessageCircle } from 'lucide-react';

export default function Footer({ setPage, user }) {
  const customerLinks = {
    Explore: [['services', 'Services'], ['stylists', 'Stylists'], ['gallery', 'Gallery']],
    Account: [['bookings', 'Bookings'], ['profile', 'Profile'], ['offers', 'Offers']],
    Help: [['about', 'About'], ['contact', 'Contact'], ['terms', 'Terms']],
  };
  const publicLinks = {
    Explore: [['home', 'Home'], ['services', 'Services'], ['gallery', 'Gallery']],
    Account: [['login', 'Log in'], ['booking', 'Book'], ['stylist-apply', 'For professionals']],
    Help: [['about', 'About'], ['contact', 'Contact'], ['terms', 'Terms']],
  };
  const staffLinks = {
    Dashboard: [[user?.role === 'admin' ? 'admin' : 'stylist', user?.role === 'admin' ? 'Admin' : 'Stylist'], ['profile', 'Profile']],
    Public: [['services', 'Services'], ['gallery', 'Gallery'], ['offers', 'Offers']],
    Help: [['contact', 'Contact'], ['terms', 'Terms'], ['privacy', 'Privacy']],
  };
  const links = user?.role === 'customer' ? customerLinks : user ? staffLinks : publicLinks;

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="brand" style={{ marginBottom: 12 }}>
            <span className="logo">GB</span>
            <span>GlowBelle</span>
          </div>
          <p>A verified beauty marketplace for customers and independent salon professionals.</p>
          <div className="social-links">
            <button type="button" aria-label="Instagram"><Camera size={18} /></button>
            <button type="button" aria-label="Facebook"><Users size={18} /></button>
            <button type="button" aria-label="Messages"><MessageCircle size={18} /></button>
          </div>
        </div>

        {Object.entries(links).map(([heading, items]) => (
          <div className="footer-col" key={heading}>
            <h4>{heading}</h4>
            {items.map(([page, label]) => (
              <button key={label} onClick={() => setPage(page)}>{label}</button>
            ))}
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <p>© 2026 GlowBelle Marketplace. All rights reserved.</p>
        <div className="footer-badges">
          <span>🔒 Secure booking</span>
          <span>✅ Verified professionals</span>
          <span>🧾 Admin-reviewed businesses</span>
        </div>
      </div>
    </footer>
  );
}
