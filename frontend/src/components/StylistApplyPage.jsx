import { useState } from 'react';
import { BriefcaseBusiness, CheckCircle2, Clock3, ShieldCheck, Upload } from 'lucide-react';
import PageHero from './PageHero.jsx';
import { glowbelleApi } from '../api.js';

export default function StylistApplyPage({ setPage }) {
  const [form, setForm] = useState({ businessType: 'independent' });
  const [files, setFiles] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const field = key => ({ value: form[key] || '', onChange: event => setForm(current => ({ ...current, [key]: event.target.value })) });

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      Object.entries(files).forEach(([key, value]) => value && data.append(key, value));
      data.append('consent', 'true');
      data.append('serviceCodes', '[]');
      const response = await glowbelleApi.registerStylist(data);
      setMessage(response.message);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  if (message) {
    return (
      <>
        <PageHero title="Application submitted" text="Your professional account is now waiting for review." icon={<CheckCircle2 />} />
        <section className="application-success">
          <div className="application-success-card">
            <span className="success-ring"><CheckCircle2 size={42} /></span>
            <h2>Thank you for applying to GlowBelle.</h2>
            <p>Your details and verification documents have been received. GlowBelle will review your identity, business information, and workspace evidence before your profile becomes visible to customers.</p>
            <div className="review-timeline">
              <div><Clock3 size={18} /><strong>Review time</strong><span>This may take up to 24 hours.</span></div>
              <div><ShieldCheck size={18} /><strong>What happens next</strong><span>You can sign in after approval to choose services, set prices, and receive bookings.</span></div>
            </div>
            <button onClick={() => setPage('login')}>Go to professional sign in</button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero title="Join as a professional" text="Apply to offer your beauty services on GlowBelle. We review every business before customers can book." icon={<BriefcaseBusiness />} />
      <form className="legal-page stylist-apply-form" onSubmit={submit}>
        <div className="note-box prep">Your profile stays private until approval. This helps keep the marketplace safe and trusted for customers.</div>
        <h2>Account details</h2>
        <div className="two-col"><input required placeholder="Full legal name on your ID" {...field('name')} /><input required type="email" placeholder="Business contact email" {...field('email')} /></div>
        <div className="two-col"><input required placeholder="WhatsApp/phone number, e.g. 08012345678" {...field('phone')} /><input required type="password" minLength="6" placeholder="Create a secure password" {...field('password')} /></div>
        <h2>Business details</h2>
        <div className="two-col"><input required placeholder="Business or display name customers will see" {...field('businessName')} /><select {...field('businessType')}><option value="independent">Independent stylist</option><option value="salon">Salon/shop</option></select></div>
        <input placeholder="CAC or business registration number, if available" {...field('registrationNumber')} />
        <input required placeholder="Shop, studio or workspace address for verification" {...field('businessAddress')} />
        <div className="two-col"><input required placeholder="City, e.g. Lagos" {...field('city')} /><input required placeholder="State, e.g. Lagos State" {...field('state')} /></div>
        <div className="two-col"><input type="number" min="0" placeholder="Years of professional experience" {...field('experienceYears')} /><input placeholder="Short bio, specialties, and services you offer" {...field('bio')} /></div>
        <h2>Verification evidence</h2>
        <p className="form-helper">Upload clear documents so GlowBelle can confirm the business is real before approving your profile.</p>
        {[['idDocument', 'Government-issued ID'], ['proofOfAddress', 'Proof of business address'], ['shopPhoto', 'Current shop/workspace photo']].map(([key, label]) => (
          <label className="upload-zone" key={key} style={{ marginBottom: 12 }}><Upload size={18} /> {files[key]?.name || label}<input required type="file" accept={key === 'shopPhoto' ? 'image/*' : 'image/*,application/pdf'} style={{ display: 'none' }} onChange={event => setFiles(current => ({ ...current, [key]: event.target.files[0] }))} /></label>
        ))}
        {error && <div className="promo-error">{error}</div>}
        <button disabled={busy || Boolean(message)}>{busy ? 'Submitting…' : 'Submit application'}</button>
        <button type="button" className="text-btn" onClick={() => setPage('login')}>Back to login</button>
      </form>
    </>
  );
}
