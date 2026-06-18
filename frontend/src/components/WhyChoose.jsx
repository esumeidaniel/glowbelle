import { CreditCard, ShieldCheck, Users, WalletCards } from 'lucide-react';
import Info from './Info.jsx';

export default function WhyChoose() {
  return (
    <section className="why">
      <Info icon={<ShieldCheck />} title="Verified professionals" text="Every stylist is reviewed and approved." />
      <Info icon={<CreditCard />} title="Secure payments" text="Pay online or at the salon safely." />
      <Info icon={<Users />} title="Family booking" text="Book for yourself, partner or children." />
      <Info icon={<WalletCards />} title="Rewards" text="Earn points, coupons and referral credits." />
    </section>
  );
}
