import { Camera, Users, MessageCircle } from 'lucide-react';

export default function Footer({ setPage, user }) {
  const customerLinks = {
    Services: [['services', 'All Services'], ['services', "Women's Hair"], ['services', "Men's Grooming"], ['services', "Kids' Care"], ['services', 'Bridal'], ['services', 'Spa & Wellness']],
    Company: [['about', 'About us'], ['stylists', 'Our stylists'], ['gallery', 'Gallery'], ['offers', 'Offers'], ['contact', 'Contact']],
    Account: [['login', 'Log in'], ['login', 'Register'], ['bookings', 'My bookings'], ['profile', 'My profile'], ['offers', 'Loyalty rewards']],
    Legal: [['privacy', 'Privacy policy'], ['terms', 'Terms & conditions'], ['cancellation', 'Cancellation policy'], ['refund', 'Refund policy'], ['contact', 'Help / FAQ']],
  };
  const publicLinks = {
    Start: [['home', 'Dashboard'], ['login', 'Customer login'], ['stylist-apply', 'Professional application']],
    Legal: [['privacy', 'Privacy policy'], ['terms', 'Terms & conditions'], ['cancellation', 'Cancellation policy'], ['refund', 'Refund policy']],
  };
  const staffLinks = {
    Dashboard: [[user?.role === 'admin' ? 'admin' : 'stylist', user?.role === 'admin' ? 'Admin dashboard' : 'Stylist dashboard'], ['profile', 'My profile']],
    Legal: [['privacy', 'Privacy policy'], ['terms', 'Terms & conditions'], ['cancellation', 'Cancellation policy'], ['refund', 'Refund policy']],
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
