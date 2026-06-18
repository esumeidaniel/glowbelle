import { BarChart3, Bell, LayoutDashboard, PlusCircle, Settings } from 'lucide-react';

export default function DashboardShell({ role, nav, cards, stylist }) {
  return (
    <div className="dashboard">
      <aside>
        <div className="brand side">
          <span className="logo">GB</span>
          <span>{role}</span>
        </div>
        {nav.map((item, index) => (
          <button className={index === 0 ? 'active' : ''} key={item}>
            {index === 0 ? <LayoutDashboard /> : <Settings />}
            {item}
          </button>
        ))}
      </aside>

      <main>
        <div className="dash-top">
          <div>
            <h1>{role} Dashboard</h1>
            <p>{stylist ? 'Manage appointments, availability, clients and reviews.' : 'Manage salon operations, bookings, services and payments.'}</p>
          </div>
          <button><Bell /> Notifications</button>
        </div>

        <div className="dash-cards">
          {cards.map(([label, value]) => (
            <div className="dash-card" key={label}>
              <p>{label}</p>
              <h2>{value}</h2>
            </div>
          ))}
        </div>

        <div className="dash-grid">
          <section>
            {/* FIX: curly apostrophe in 'Today's' inside a JS string causes a parse error */}
            <h3>{stylist ? "Today's schedule" : 'Recent bookings'}</h3>
            {['10:00 Silk Press - Sarah', '12:30 Kids Cut - Daniel', '2:30 Bridal Trial - Amaka', '5:00 Facial - Tola'].map((row) => (
              <div className="dash-row" key={row}>
                <span>{row}</span>
                <button>View</button>
              </div>
            ))}
          </section>

          <section>
            <h3>{stylist ? 'Performance' : 'Management'}</h3>
            <div className="chart"><BarChart3 /> Weekly activity</div>
            <button><PlusCircle /> Add New</button>
          </section>
        </div>
      </main>
    </div>
  );
}
