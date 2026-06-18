import { ShieldCheck } from 'lucide-react';
import PageHero from './PageHero.jsx';

const policies = {
  privacy: ['Privacy Policy', [
    ['Information we collect', 'We collect account, contact, appointment, uploaded image, and service-preference information needed to provide salon booking services.'],
    ['How we use information', 'We use information to manage bookings, communicate service updates, prevent fraud, support customers, and meet legal obligations.'],
    ['Your choices', 'You may request access, correction, or deletion of eligible personal information by contacting the support address published on this website.'],
  ]],
  terms: ['Terms and Conditions', [
    ['Bookings', 'A booking is created when a customer chooses a verified professional, service, date and time, then submits the appointment request.'],
    ['Customer responsibilities', 'Customers must provide accurate contact and service information and disclose relevant allergies or health concerns before treatment.'],
    ['Payments', 'GlowBelle currently uses Pay at Salon only. Customers pay the professional directly after the service.'],
  ]],
  cancellation: ['Cancellation Policy', [
    ['Changes and cancellations', 'Customers should cancel or reschedule before the appointment starts so the professional can manage their calendar. Repeated cancellations may be reviewed by admin.'],
    ['Late arrival', 'Late arrival may shorten or require rescheduling an appointment so later customers are not delayed.'],
  ]],
  refund: ['Refund Policy', [
    ['Eligibility', 'Because payment is made directly at the salon, service concerns should first be discussed with the professional. Customers may contact GlowBelle support if a dispute needs review.'],
    ['Processing', 'Any approved adjustment or refund is handled between the customer and professional because online card payment is not enabled for this launch.'],
  ]],
};

export default function LegalPage({ type = 'privacy' }) {
  const [title, sections] = policies[type] || policies.privacy;
  return (
    <>
      <PageHero title={title} text="Please review this information before using GlowBelle services." icon={<ShieldCheck />} />
      <article className="legal-page">
        <div className="note-box prep"><strong>Effective for launch.</strong> GlowBelle currently supports verified professional booking with Pay at Salon.</div>
        {sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
      </article>
    </>
  );
}
