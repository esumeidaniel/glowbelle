import {
  AlertCircle,
  Bell,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import Avatar from './Avatar.jsx';
import { glowbelleApi, setToken } from '../api.js';
import { toast } from '../toast.js';

const PROFILE_TABS = [
  ['profile', User, 'My Profile'],
  ['family', Users, 'Family Members'],
  ['notifications', Bell, 'Notifications'],
  ['security', ShieldCheck, 'Security'],
  ['preferences', Settings, 'Preferences'],
];

const CATEGORY_OPTIONS = ['Braids', 'Wigs', 'Nails', 'Makeup', 'Barbering', 'Spa', 'Kids', 'Bridal'];

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function primaryAddress(user = {}) {
  return user.addresses?.find(item => item.isDefault) || user.addresses?.[0] || {};
}

function initialProfileForm(user = {}) {
  const address = primaryAddress(user);
  return {
    name: user.name || '',
    emailDraft: user.email || '',
    phone: user.phone || '',
    gender: user.gender || '',
    birthday: toDateInput(user.birthday),
    street: address.street || '',
    city: address.city || '',
    state: address.state || '',
    preferredLocationArea: user.preferredLocationArea || '',
    avatarUrl: user.avatarUrl || '',
  };
}

function profilePayload(form) {
  const address = {
    label: 'Primary',
    street: form.street.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    isDefault: true,
  };
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    avatarUrl: form.avatarUrl,
    gender: form.gender,
    birthday: form.birthday || undefined,
    preferredLocationArea: form.preferredLocationArea.trim(),
    addresses: [address].some(item => item.street || item.city || item.state) ? [address] : [],
  };
}

function familyFormDefaults() {
  return {
    name: '',
    relationship: 'Child',
    ageGroup: 'Child',
    age: '',
    hairType: '',
    allergies: '',
    preferredServices: '',
    notes: '',
  };
}

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <label className="profile-toggle-row">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

function Modal({ title, children, onClose, danger = false }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={danger ? 'modal-card profile-modal danger' : 'modal-card profile-modal'} onClick={event => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function ProfilePage({ setPage, user, setUser }) {
  const profile = user || {};
  const fileRef = useRef(null);
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState(() => initialProfileForm(profile));
  const [savedBaseline, setSavedBaseline] = useState(() => initialProfileForm(profile));
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const [family, setFamily] = useState(() => (profile.children || []).map((item, index) => ({
    id: item.id || `family-${index}-${item.name || 'member'}`,
    ...familyFormDefaults(),
    ...item,
    preferredServices: Array.isArray(item.preferredServices) ? item.preferredServices.join(', ') : item.preferredServices || '',
  })));
  const [familyDraft, setFamilyDraft] = useState(familyFormDefaults);
  const [editingFamilyId, setEditingFamilyId] = useState('');
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [familyBusy, setFamilyBusy] = useState(false);

  const [notifications, setNotifications] = useState({
    emailConfirmations: profile.notificationPreferences?.emailConfirmations ?? true,
    smsReminders: profile.notificationPreferences?.smsReminders ?? true,
    whatsappUpdates: profile.notificationPreferences?.whatsappUpdates ?? true,
    bookingCancellations: profile.notificationPreferences?.bookingCancellations ?? true,
    stylistMessages: profile.notificationPreferences?.stylistMessages ?? true,
    promotions: profile.notificationPreferences?.promotions ?? false,
    emailUpdates: profile.notificationPreferences?.emailUpdates ?? true,
  });
  const [notificationBusy, setNotificationBusy] = useState(false);

  const [preferences, setPreferences] = useState({
    preferredServiceLocation: profile.preferences?.preferredServiceLocation || 'Salon visit',
    preferredBranch: profile.preferences?.preferredBranch || '',
    preferredCategories: Array.isArray(profile.preferences?.preferredCategories) ? profile.preferences.preferredCategories : [],
    preferredStylist: profile.preferences?.preferredStylist || '',
    language: profile.preferences?.language || 'English',
    currency: profile.preferences?.currency || 'NGN',
  });
  const [preferencesBusy, setPreferencesBusy] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordCodeSent, setPasswordCodeSent] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', code: '', newPassword: '', confirmPassword: '' });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletionCodeSent, setDeletionCodeSent] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ phrase: '', code: '' });
  const [deletionBusy, setDeletionBusy] = useState(false);
  const [deletionError, setDeletionError] = useState('');
  const [deletionMessage, setDeletionMessage] = useState('');

  const hasProfileChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedBaseline), [form, savedBaseline]);
  const emailChanged = form.emailDraft.trim().toLowerCase() !== String(profile.email || '').toLowerCase();
  const emailStatus = profile.emailVerified ? 'Verified' : 'Verification needed';

  function setField(key, value) {
    setForm(current => ({ ...current, [key]: value }));
    setProfileError('');
    setEmailMessage('');
  }

  function resetPasswordModal() {
    setPasswordOpen(false);
    setPasswordCodeSent(false);
    setPasswordForm({ currentPassword: '', code: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordMessage('');
  }

  function resetDeleteModal() {
    setDeleteOpen(false);
    setDeletionCodeSent(false);
    setDeleteForm({ phrase: '', code: '' });
    setDeletionError('');
    setDeletionMessage('');
  }

  async function handleAvatarFile(file) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setProfileError('Profile photo must be 1MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField('avatarUrl', String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    if (!hasProfileChanges) return;
    setProfileBusy(true);
    setProfileError('');
    try {
      if (emailChanged) {
        setEmailMessage('Email changes require verification. Your current email will stay active until a verified email-change flow is available.');
      }
      const response = await glowbelleApi.updateProfile(profilePayload(form));
      const nextUser = response.data;
      if (setUser) setUser(nextUser);
      const nextBaseline = initialProfileForm(nextUser);
      setSavedBaseline(nextBaseline);
      setForm(nextBaseline);
      toast('Profile saved', 'success');
    } catch (err) {
      setProfileError(err.message || 'Could not save profile.');
    } finally {
      setProfileBusy(false);
    }
  }

  async function sendEmailVerification() {
    setEmailMessage('');
    try {
      if (emailChanged) {
        setEmailMessage('Email changes require verification. Keep using your current email until this account-security flow is enabled.');
        return;
      }
      const response = await glowbelleApi.resendVerification(profile.email);
      setEmailMessage(response.message || 'Verification code sent to your email.');
      toast('Verification code sent', 'success');
    } catch (err) {
      setEmailMessage(err.message || 'Could not send verification code.');
    }
  }

  function submitFamilyMember() {
    if (!familyDraft.name.trim()) return;
    const nextMember = {
      ...familyDraft,
      id: editingFamilyId || `family-${Date.now()}`,
      name: familyDraft.name.trim(),
    };
    setFamily(current => editingFamilyId
      ? current.map(item => item.id === editingFamilyId ? nextMember : item)
      : [...current, nextMember]);
    setFamilyDraft(familyFormDefaults());
    setEditingFamilyId('');
    setShowFamilyForm(false);
  }

  function editFamilyMember(member) {
    setFamilyDraft({ ...familyFormDefaults(), ...member });
    setEditingFamilyId(member.id);
    setShowFamilyForm(true);
  }

  function serializableFamily() {
    return family.map(({ preferredServices, age, ...member }) => {
      const payload = { ...member };
      delete payload.id;
      return {
        ...payload,
        age: age ? Number(age) : undefined,
        preferredServices: String(preferredServices || '').split(',').map(item => item.trim()).filter(Boolean),
      };
    });
  }

  async function saveFamilyMembers() {
    setFamilyBusy(true);
    try {
      const response = await glowbelleApi.updateProfile({ children: serializableFamily() });
      if (setUser) setUser(response.data);
      toast('Family members saved', 'success');
    } catch (err) {
      toast(err.message || 'Could not save family members.', 'error');
    } finally {
      setFamilyBusy(false);
    }
  }

  async function saveNotifications() {
    setNotificationBusy(true);
    try {
      const response = await glowbelleApi.updateProfile({ notificationPreferences: notifications });
      if (setUser) setUser(response.data);
      toast('Notification settings saved', 'success');
    } catch (err) {
      toast(err.message || 'Could not save notification preferences.', 'error');
    } finally {
      setNotificationBusy(false);
    }
  }

  async function savePreferences() {
    setPreferencesBusy(true);
    try {
      const response = await glowbelleApi.updateProfile({ preferences });
      if (setUser) setUser(response.data);
      toast('Preferences saved', 'success');
    } catch (err) {
      toast(err.message || 'Could not save preferences.', 'error');
    } finally {
      setPreferencesBusy(false);
    }
  }

  async function requestPasswordCode() {
    setPasswordBusy(true);
    setPasswordError('');
    setPasswordMessage('');
    try {
      const response = await glowbelleApi.requestPasswordChange();
      setPasswordCodeSent(true);
      setPasswordMessage(response.message || 'A password change code has been sent to your email.');
    } catch (err) {
      setPasswordError(err.message || 'Could not send password change code.');
    } finally {
      setPasswordBusy(false);
    }
  }

  async function confirmPasswordChange() {
    setPasswordError('');
    setPasswordMessage('');
    if (!passwordForm.currentPassword || !passwordForm.code || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Current password, verification code and both new password fields are required.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordBusy(true);
    try {
      const response = await glowbelleApi.confirmPasswordChange({
        currentPassword: passwordForm.currentPassword,
        code: passwordForm.code,
        password: passwordForm.newPassword,
      });
      setPasswordMessage(response.message || 'Your password has been changed successfully.');
      setPasswordForm({ currentPassword: '', code: '', newPassword: '', confirmPassword: '' });
      setPasswordCodeSent(false);
      toast('Password changed', 'success');
    } catch (err) {
      setPasswordError(err.message || 'Could not change password.');
    } finally {
      setPasswordBusy(false);
    }
  }

  async function requestDeletionCode() {
    setDeletionBusy(true);
    setDeletionError('');
    setDeletionMessage('');
    try {
      const response = await glowbelleApi.requestAccountDeletion();
      setDeletionCodeSent(true);
      setDeletionMessage(response.message || 'An account deletion code has been sent to your email.');
    } catch (err) {
      setDeletionError(err.message || 'Could not send account deletion code.');
    } finally {
      setDeletionBusy(false);
    }
  }

  async function confirmDeletion() {
    setDeletionError('');
    if (deleteForm.phrase !== 'DELETE') {
      setDeletionError('Type DELETE to confirm account deletion.');
      return;
    }
    if (deleteForm.code.length !== 6) {
      setDeletionError('Enter the 6-digit account deletion code.');
      return;
    }
    setDeletionBusy(true);
    try {
      await glowbelleApi.confirmAccountDeletion(deleteForm.code);
      setToken(null);
      setUser?.(null);
      setPage?.('home');
    } catch (err) {
      setDeletionError(err.message || 'Could not delete account.');
    } finally {
      setDeletionBusy(false);
    }
  }

  function toggleCategory(category) {
    setPreferences(current => ({
      ...current,
      preferredCategories: current.preferredCategories.includes(category)
        ? current.preferredCategories.filter(item => item !== category)
        : [...current.preferredCategories, category],
    }));
  }

  return (
    <div className="profile-page-shell">
      <div className="profile-layout enhanced-profile-layout">
        <aside className="profile-nav enhanced-profile-nav">
          <div className="profile-avatar-block">
            <Avatar name={form.name} src={form.avatarUrl} size={82} />
            <div>
              <strong>{form.name || 'GlowBelle customer'}</strong>
              <p title={profile.email}>{profile.email}</p>
              <span className="loyalty-pts">{profile.loyaltyPoints ?? profile.points ?? 0} pts</span>
            </div>
          </div>
          {PROFILE_TABS.map(([id, Icon, label]) => (
            <button key={id} className={tab === id ? 'profile-nav-btn active' : 'profile-nav-btn'} onClick={() => setTab(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </aside>

        <main className="profile-main">
          <div className="profile-mobile-tabs">
            {PROFILE_TABS.map(([id, Icon, label]) => (
              <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {tab === 'profile' && (
            <section className="profile-section enhanced-profile-section">
              <div className="profile-section-title">
                <h2>Personal information</h2>
                <p>Keep your booking contact details accurate so stylists can reach you.</p>
              </div>
              <div className="profile-summary-card enhanced-summary-card">
                <Avatar name={form.name} src={form.avatarUrl} size={86} />
                <div>
                  <span>Customer profile</span>
                  <strong>{form.name || 'Your name'}</strong>
                  <p title={profile.email}>{profile.email}</p>
                  <small>{form.phone || 'No phone number added yet'}</small>
                </div>
                <div className="profile-photo-actions">
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => handleAvatarFile(event.target.files?.[0])} />
                  <button type="button" onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload photo</button>
                  {form.avatarUrl && <button type="button" className="secondary" onClick={() => setField('avatarUrl', '')}>Remove photo</button>}
                </div>
              </div>

              <div className="profile-form enhanced-profile-form">
                <div className="two-col">
                  <label className="form-row"><span>Full name</span><input value={form.name} onChange={event => setField('name', event.target.value)} placeholder="Your full name" /></label>
                  <label className="form-row"><span>Phone / WhatsApp number</span><input value={form.phone} onChange={event => setField('phone', event.target.value)} placeholder="Add phone number" /></label>
                </div>
                <label className="form-row">
                  <span>Email address</span>
                  <input type="email" value={form.emailDraft} onChange={event => setField('emailDraft', event.target.value)} />
                  <small>Email changes require verification. Your current login email remains active until verified.</small>
                </label>
                {emailChanged && <div className="note-box prep">Email changes require verification before GlowBelle can update your login email.</div>}
                <div className="two-col">
                  <label className="form-row"><span>Gender (optional)</span><select value={form.gender} onChange={event => setField('gender', event.target.value)}><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option></select></label>
                  <label className="form-row"><span>Birthday (optional)</span><input type="date" value={form.birthday} onChange={event => setField('birthday', event.target.value)} /></label>
                </div>
                <div className="two-col">
                  <label className="form-row"><span>Address</span><input value={form.street} onChange={event => setField('street', event.target.value)} placeholder="Street address" /></label>
                  <label className="form-row"><span>Preferred area</span><input value={form.preferredLocationArea} onChange={event => setField('preferredLocationArea', event.target.value)} placeholder="Lekki, VI, Ikeja..." /></label>
                </div>
                <div className="two-col">
                  <label className="form-row"><span>City</span><input value={form.city} onChange={event => setField('city', event.target.value)} placeholder="City" /></label>
                  <label className="form-row"><span>State</span><input value={form.state} onChange={event => setField('state', event.target.value)} placeholder="State" /></label>
                </div>
                {profileError && <div className="promo-error"><AlertCircle size={14} /> {profileError}</div>}
                {emailMessage && <div className="note-box prep">{emailMessage}</div>}
                <div className="profile-form-actions">
                  <button onClick={saveProfile} disabled={!hasProfileChanges || profileBusy}>{profileBusy ? 'Saving...' : 'Save changes'}</button>
                  <button type="button" className="secondary" onClick={sendEmailVerification}><Mail size={14} /> Send verification code</button>
                </div>
              </div>
            </section>
          )}

          {tab === 'family' && (
            <section className="profile-section enhanced-profile-section">
              <div className="section-header">
                <div className="profile-section-title"><h2>Family members</h2><p>Add details that help stylists prepare for child and family bookings.</p></div>
                <button onClick={() => { setFamilyDraft(familyFormDefaults()); setEditingFamilyId(''); setShowFamilyForm(true); }}><Plus size={16} /> Add member</button>
              </div>
              <div className="family-list enhanced-family-list">
                {!family.length && <div className="empty-state"><Users size={34} /><h3>No family members yet</h3><p>Add a child, partner, parent or family member when you want to book for someone else.</p></div>}
                {family.map(member => (
                  <article className="family-card enhanced-family-card" key={member.id}>
                    <Avatar name={member.name} size={52} />
                    <div>
                      <strong>{member.name}</strong>
                      <p>{member.relationship || member.relation || 'Family member'} · {member.ageGroup || 'Age group not set'}</p>
                      {member.hairType && <small>Hair type: {member.hairType}</small>}
                      {member.allergies && <small>Allergies/special needs: {member.allergies}</small>}
                      {member.notes && <small>{member.notes}</small>}
                    </div>
                    <div className="family-actions">
                      <button onClick={() => editFamilyMember(member)}>Edit</button>
                      <button className="ghost" onClick={() => setFamily(current => current.filter(item => item.id !== member.id))}>Remove</button>
                    </div>
                  </article>
                ))}
              </div>
              {showFamilyForm && (
                <div className="add-member-form enhanced-family-form">
                  <h3>{editingFamilyId ? 'Edit family member' : 'Add family member'}</h3>
                  <div className="two-col">
                    <label>Name<input value={familyDraft.name} onChange={event => setFamilyDraft(current => ({ ...current, name: event.target.value }))} placeholder="Full name" /></label>
                    <label>Relationship<select value={familyDraft.relationship} onChange={event => setFamilyDraft(current => ({ ...current, relationship: event.target.value }))}><option>Child</option><option>Partner</option><option>Parent</option><option>Other</option></select></label>
                  </div>
                  <div className="two-col">
                    <label>Age group<select value={familyDraft.ageGroup} onChange={event => setFamilyDraft(current => ({ ...current, ageGroup: event.target.value }))}><option>Child</option><option>Teenager</option><option>Adult</option><option>Senior</option></select></label>
                    <label>Age (optional)<input type="number" min="0" value={familyDraft.age} onChange={event => setFamilyDraft(current => ({ ...current, age: event.target.value }))} placeholder="Age" /></label>
                  </div>
                  <div className="two-col">
                    <label>Hair type / notes<input value={familyDraft.hairType} onChange={event => setFamilyDraft(current => ({ ...current, hairType: event.target.value }))} placeholder="Natural hair, relaxed, locs..." /></label>
                    <label>Preferred services<input value={familyDraft.preferredServices} onChange={event => setFamilyDraft(current => ({ ...current, preferredServices: event.target.value }))} placeholder="Braids, kids cut, wash day..." /></label>
                  </div>
                  <label>Allergies or special needs<textarea value={familyDraft.allergies} onChange={event => setFamilyDraft(current => ({ ...current, allergies: event.target.value }))} placeholder="Products to avoid, sensitivities, accessibility notes..." /></label>
                  <label>Extra notes<textarea value={familyDraft.notes} onChange={event => setFamilyDraft(current => ({ ...current, notes: event.target.value }))} placeholder="Anything else the stylist should know." /></label>
                  <div className="profile-form-actions">
                    <button onClick={submitFamilyMember}>{editingFamilyId ? 'Update member' : 'Add member'}</button>
                    <button className="secondary" onClick={() => setShowFamilyForm(false)}>Cancel</button>
                  </div>
                </div>
              )}
              <button className="settings-save-btn" onClick={saveFamilyMembers} disabled={familyBusy}>{familyBusy ? 'Saving...' : 'Save family members'}</button>
            </section>
          )}

          {tab === 'notifications' && (
            <section className="profile-section enhanced-profile-section">
              <div className="profile-section-title"><h2>Notification preferences</h2><p>Choose how GlowBelle should contact you about bookings and offers.</p></div>
              <div className="profile-toggle-list">
                <ToggleRow title="Booking confirmation" description="Send confirmation when a booking is created." checked={notifications.emailConfirmations} onChange={value => setNotifications(current => ({ ...current, emailConfirmations: value }))} />
                <ToggleRow title="Booking reminders" description="Reminders before upcoming appointments." checked={notifications.smsReminders} onChange={value => setNotifications(current => ({ ...current, smsReminders: value }))} />
                <ToggleRow title="Cancellation updates" description="Updates if a booking is cancelled or changed." checked={notifications.bookingCancellations} onChange={value => setNotifications(current => ({ ...current, bookingCancellations: value }))} />
                <ToggleRow title="Stylist messages" description="Messages and appointment notes from stylists." checked={notifications.stylistMessages} onChange={value => setNotifications(current => ({ ...current, stylistMessages: value }))} />
                <ToggleRow title="Promo/offers" description="Discounts, seasonal deals and rewards." checked={notifications.promotions} onChange={value => setNotifications(current => ({ ...current, promotions: value }))} />
                <ToggleRow title="WhatsApp/SMS updates" description="Receive useful appointment updates on mobile." checked={notifications.whatsappUpdates} onChange={value => setNotifications(current => ({ ...current, whatsappUpdates: value }))} />
                <ToggleRow title="Email updates" description="Receive booking and account emails." checked={notifications.emailUpdates} onChange={value => setNotifications(current => ({ ...current, emailUpdates: value }))} />
              </div>
              <button className="settings-save-btn" onClick={saveNotifications} disabled={notificationBusy}>{notificationBusy ? 'Saving...' : 'Save notification settings'}</button>
            </section>
          )}

          {tab === 'security' && (
            <section className="profile-section enhanced-profile-section">
              <div className="profile-section-title"><h2>Security</h2><p>Protect your login, verification status and account access.</p></div>
              <div className="security-grid">
                <div className="security-card"><Lock size={20} /><div><strong>Password</strong><p>Password set</p></div><button onClick={() => setPasswordOpen(true)}>Change Password</button></div>
                <div className="security-card"><Mail size={20} /><div><strong>Email verification</strong><p>{emailStatus}</p></div><button className="secondary" onClick={sendEmailVerification}>Send code</button></div>
                <div className="security-card"><Phone size={20} /><div><strong>Phone verification</strong><p>{form.phone ? 'Phone added' : 'No phone number added yet'}</p></div><button className="secondary" onClick={() => setTab('profile')}>{form.phone ? 'Edit phone' : 'Add phone number'}</button></div>
                <div className="security-card muted"><KeyRound size={20} /><div><strong>Logout from all devices</strong><p>Coming soon</p></div><button disabled>Unavailable</button></div>
              </div>
              <div className="danger-zone enhanced-danger-zone">
                <h3>Danger zone</h3>
                <p>This action removes profile access and anonymizes personal account details.</p>
                <button className="danger-btn" onClick={() => setDeleteOpen(true)}><Trash2 size={14} /> Delete account</button>
              </div>
            </section>
          )}

          {tab === 'preferences' && (
            <section className="profile-section enhanced-profile-section">
              <div className="profile-section-title"><h2>Preferences</h2><p>Personalize the way GlowBelle suggests services and booking options.</p></div>
              <div className="enhanced-profile-form">
                <div className="two-col">
                  <label className="form-row"><span>Preferred service location</span><select value={preferences.preferredServiceLocation} onChange={event => setPreferences(current => ({ ...current, preferredServiceLocation: event.target.value }))}><option>Salon visit</option><option>Home service</option><option>Either</option></select></label>
                  <label className="form-row"><span>Preferred branch/location</span><input value={preferences.preferredBranch} onChange={event => setPreferences(current => ({ ...current, preferredBranch: event.target.value }))} placeholder="Victoria Island, Lekki..." /></label>
                </div>
                <label className="form-row"><span>Preferred stylist</span><input value={preferences.preferredStylist} onChange={event => setPreferences(current => ({ ...current, preferredStylist: event.target.value }))} placeholder="Stylist name, optional" /></label>
                <div className="preference-chip-grid">
                  {CATEGORY_OPTIONS.map(category => (
                    <button key={category} className={preferences.preferredCategories.includes(category) ? 'chip selected' : 'chip'} onClick={() => toggleCategory(category)}>{category}</button>
                  ))}
                </div>
                <div className="two-col">
                  <label className="form-row"><span>Language</span><select value={preferences.language} onChange={event => setPreferences(current => ({ ...current, language: event.target.value }))}><option>English</option><option>French</option><option>Yoruba</option><option>Igbo</option><option>Hausa</option></select></label>
                  <label className="form-row"><span>Currency display</span><select value={preferences.currency} onChange={event => setPreferences(current => ({ ...current, currency: event.target.value }))}><option value="NGN">₦ Nigerian Naira</option><option value="USD">$ US Dollar</option><option value="GBP">£ British Pound</option><option value="EUR">€ Euro</option></select></label>
                </div>
                <button className="settings-save-btn" onClick={savePreferences} disabled={preferencesBusy}>{preferencesBusy ? 'Saving...' : 'Save preferences'}</button>
              </div>
            </section>
          )}
        </main>
      </div>

      {passwordOpen && (
        <Modal title="Change Password" onClose={resetPasswordModal}>
          <p className="modal-helper">Enter your current password, request a verification code, then choose a new password.</p>
          <label className="form-row"><span>Current password</span><input type="password" value={passwordForm.currentPassword} onChange={event => setPasswordForm(current => ({ ...current, currentPassword: event.target.value }))} /></label>
          <div className="profile-form-actions">
            <button onClick={requestPasswordCode} disabled={passwordBusy}>{passwordBusy ? 'Sending...' : passwordCodeSent ? 'Resend verification code' : 'Send verification code'}</button>
          </div>
          <label className="form-row"><span>Verification code</span><input inputMode="numeric" maxLength={6} value={passwordForm.code} onChange={event => setPasswordForm(current => ({ ...current, code: event.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="6-digit code" /></label>
          <div className="two-col">
            <label className="form-row"><span>New password</span><input type="password" value={passwordForm.newPassword} onChange={event => setPasswordForm(current => ({ ...current, newPassword: event.target.value }))} /></label>
            <label className="form-row"><span>Confirm new password</span><input type="password" value={passwordForm.confirmPassword} onChange={event => setPasswordForm(current => ({ ...current, confirmPassword: event.target.value }))} /></label>
          </div>
          {passwordMessage && <div className="promo-success"><CheckCircle2 size={14} /> {passwordMessage}</div>}
          {passwordError && <div className="promo-error"><AlertCircle size={14} /> {passwordError}</div>}
          <div className="profile-form-actions">
            <button onClick={confirmPasswordChange} disabled={passwordBusy}>{passwordBusy ? 'Changing...' : 'Change Password'}</button>
            <button className="secondary" onClick={resetPasswordModal}>Cancel</button>
          </div>
        </Modal>
      )}

      {deleteOpen && (
        <Modal title="Delete account?" onClose={resetDeleteModal} danger>
          <p className="modal-helper">This will remove your profile, booking history access, saved family members and account access. This action cannot be undone.</p>
          <div className="profile-form-actions">
            <button className="danger-btn" onClick={requestDeletionCode} disabled={deletionBusy}>{deletionBusy ? 'Sending...' : deletionCodeSent ? 'Resend deletion code' : 'Email deletion code'}</button>
          </div>
          <label className="form-row"><span>Type DELETE</span><input value={deleteForm.phrase} onChange={event => setDeleteForm(current => ({ ...current, phrase: event.target.value }))} placeholder="DELETE" /></label>
          <label className="form-row"><span>Deletion code</span><input inputMode="numeric" maxLength={6} value={deleteForm.code} onChange={event => setDeleteForm(current => ({ ...current, code: event.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="6-digit code" /></label>
          {deletionMessage && <div className="promo-success">{deletionMessage}</div>}
          {deletionError && <div className="promo-error"><AlertCircle size={14} /> {deletionError}</div>}
          <div className="profile-form-actions">
            <button className="danger-btn" onClick={confirmDeletion} disabled={deletionBusy}>{deletionBusy ? 'Deleting...' : 'Delete account'}</button>
            <button className="secondary" onClick={resetDeleteModal}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
