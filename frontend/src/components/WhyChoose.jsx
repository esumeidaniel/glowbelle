import { BadgeCheck, CalendarCheck, ShieldCheck, WalletCards } from 'lucide-react';
import Info from './Info.jsx';

export default function WhyChoose() {
  return (
    <section className="why">
      <Info icon={<ShieldCheck />} title="Verified professionals" text="Business profiles are reviewed before they appear publicly." />
      <Info icon={<CalendarCheck />} title="Direct booking" text="Customers book the exact stylist they choose." />
      <Info icon={<WalletCards />} title="Pay at salon" text="No online payment needed for launch; customers pay after service." />
      <Info icon={<BadgeCheck />} title="Managed trust" text="Admin can review professionals, bookings, and platform quality." />
    </section>
  );
}
