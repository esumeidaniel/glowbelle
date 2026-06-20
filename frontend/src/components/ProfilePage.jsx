import { User, Bell, Star, Users, Trash2, Plus, KeyRound, Lock } from 'lucide-react';
import { useState } from 'react';
import Avatar from './Avatar.jsx';
import PageHero from './PageHero.jsx';
import { glowbelleApi, setToken } from '../api.js';

const FAMILY_MEMBERS = [
  { id: 'fm1', name: 'Chidi Mensah', relation: 'Partner', gender: 'Male', hairType: 'Low fade' },
  { id: 'fm2', name: 'Adaeze Jr.', relation: 'Child', gender: 'Female', age: 6, allergies: 'None', hairType: 'Natural 4C' },
];

// FIX: useState cannot be called inside a .map() callback — extracted to a proper component
function NotifRow({ label, checked, onChange }) {
  return (
    <div className="notif-row">
      <span>{label}</span>
      <button type="button" className={checked ? 'toggle-btn on' : 'toggle-btn'} onClick={() => onChange(!checked)} aria-pressed={checked}>
        {checked ? 'On' : 'Off'}
      </button>
    </div>
  );
}

export default function ProfilePage({ setPage, user, setUser }) {
  const profile = user;
  const businessName = profile.businessName || profile.business?.name || profile.stylistProfile?.business?.name || '';
  const [tab, setTab] = useState('profile');
  const [name, setName] = useState(profile.name);
  const email = profile.email;
  const [phone, setPhone] = useState(profile.phone);
  const [saved, setSaved] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [family, setFamily] = useState(FAMILY_MEMBERS);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relation: 'Child', gender: 'Female', age: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordCodeSent, setPasswordCodeSent] = useState(false);
  const [passwordCode, setPasswordCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [notifications, setNotifications] = useState({
    emailConfirmations: profile.notificationPreferences?.emailConfirmations ?? true,
    smsReminders: profile.notificationPreferences?.smsReminders ?? true,
    whatsappUpdates: profile.notificationPreferences?.whatsappUpdates ?? true,
    promotions: profile.notificationPreferences?.promotions ?? false,
    stylistAvailability: profile.notificationPreferences?.stylistAvailability ?? false,
  });
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationError, setNotificationError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletionCodeSent, setDeletionCodeSent] = useState(false);
  const [deletionCode, setDeletionCode] = useState('');
  const [deletionBusy, setDeletionBusy] = useState(false);
  const [deletionMessage, setDeletionMessage] = useState('');
  const [deletionError, setDeletionError] = useState('');

  async function save() {
    setProfileBusy(true);
    setProfileError('');
    try {
      const response = await glowbelleApi.updateProfile({ name, phone });
      if (setUser) setUser(response.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setProfileError(err.message || 'Could not save profile.');
    } finally {
      setProfileBusy(false);
    }
  }

  function addMember() {
    if (!newMember.name) return;
    setFamily(prev => [...prev, { id: 'fm' + Date.now(), ...newMember }]);
    setNewMember({ name: '', relation: 'Child', gender: 'Female', age: '' });
    setAddingMember(false);
  }

  function closePasswordChange() {
    setChangingPassword(false);
    setPasswordCodeSent(false);
    setPasswordCode('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
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
    if (!passwordCode || !newPassword || !confirmPassword) {
      setPasswordError('Enter the code and both new password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordBusy(true);
    try {
      const response = await glowbelleApi.confirmPasswordChange({ code: passwordCode, password: newPassword });
      setPasswordMessage(response.message || 'Your password has been changed successfully.');
      setPasswordCode('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordCodeSent(false);
    } catch (err) {
      setPasswordError(err.message || 'Could not change password.');
    } finally {
      setPasswordBusy(false);
    }
  }

  async function saveNotifications() {
    setNotificationBusy(true);
    setNotificationMessage('');
    setNotificationError('');
    try {
      const response = await glowbelleApi.updateProfile({ notificationPreferences: notifications });
      if (setUser) setUser(response.data);
      setNotificationMessage('Notification preferences saved.');
    } catch (err) {
      setNotificationError(err.message || 'Could not save notification preferences.');
    } finally {
      setNotificationBusy(false);
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
    if (deletionCode.length !== 6) {
      setDeletionError('Enter the 6-digit account deletion code.');
      return;
    }
    setDeletionBusy(true);
    setDeletionError('');
    try {
      await glowbelleApi.confirmAccountDeletion(deletionCode);
      setToken(null);
      setUser(null);
      setPage('home');
    } catch (err) {
      setDeletionError(err.message || 'Could not delete account.');
    } finally {
      setDeletionBusy(false);
    }
  }

  return (
    <>
      <PageHero title="My profile" text="Manage your personal details, bookings, family members and notification settings." icon={<User />} />

      <div className="profile-layout">
        <aside className="profile-nav">
          <div className="profile-avatar-block">
            <Avatar name={profile.name} size={80} />
            <div>
              <strong>{profile.name}</strong>
              <p>{profile.email}</p>
              <span className="loyalty-pts">🏆 {profile.points || 450} pts</span>
            </div>
          </div>
          {[['profile', <User size={16} />, 'My Profile'], ['family', <Users size={16} />, 'Family Members'], ['rewards', <Star size={16} />, 'Rewards'], ['notifications', <Bell size={16} />, 'Notifications']].map(([id, icon, label]) => (
            <button key={id} className={tab === id ? 'profile-nav-btn active' : 'profile-nav-btn'} onClick={() => setTab(id)}>
              {icon} {label}
            </button>
          ))}
        </aside>

        <main className="profile-main">
          {tab === 'profile' && (
            <div className="profile-section">
              <h2>Personal information</h2>
              <div className="profile-summary-card">
                <Avatar name={profile.name} size={72} />
                <div>
                  {businessName && <span>{businessName}</span>}
                  <strong>{profile.name}</strong>
                  <p>{profile.email}</p>
                  <small>{profile.phone || 'No phone number added yet'}</small>
                </div>
              </div>
              <div className="profile-form">
                <div className="form-row">
                  <label>Full name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name as customers or staff will see it" />
                </div>
                <div className="form-row">
                  <label>Email address</label>
                  <input type="email" value={email} readOnly aria-readonly="true" />
                  <small>Email changes require separate verification.</small>
                </div>
                <div className="form-row">
                  <label>Phone number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone/WhatsApp number, e.g. 08012345678" />
                </div>
                <div className="form-row">
                  <label>Password</label>
                  <input type="password" value="••••••••" readOnly />
                  <button type="button" className="text-btn" style={{ marginTop: 4 }} onClick={() => { setChangingPassword(true); setPasswordMessage(''); }}>Change password</button>
                </div>
                {changingPassword && (
                  <div className="password-change-box">
                    <div className="password-change-title"><Lock size={18} /><strong>Secure password change</strong></div>
                    {!passwordCodeSent ? (
                      <>
                        <p>We will email a 6-digit code to {profile.email} before your password can be changed.</p>
                        <div className="password-change-actions">
                          <button type="button" onClick={requestPasswordCode} disabled={passwordBusy}>{passwordBusy ? 'Sending code...' : 'Send verification code'}</button>
                          <button type="button" className="secondary" onClick={closePasswordChange}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-row">
                          <label>Password change code</label>
                          <div className="input-wrap"><KeyRound size={16} /><input inputMode="numeric" maxLength={6} placeholder="Enter the 6-digit password code" value={passwordCode} onChange={e => setPasswordCode(e.target.value.replace(/\D/g, '').slice(0, 6))} /></div>
                        </div>
                        <div className="two-col">
                          <div className="form-row"><label>New password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Create a stronger new password" /></div>
                          <div className="form-row"><label>Confirm new password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter the same new password" /></div>
                        </div>
                        <div className="password-change-actions">
                          <button type="button" onClick={confirmPasswordChange} disabled={passwordBusy}>{passwordBusy ? 'Changing password...' : 'Change password'}</button>
                          <button type="button" className="secondary" onClick={requestPasswordCode} disabled={passwordBusy}>Resend code</button>
                          <button type="button" className="secondary" onClick={closePasswordChange}>Cancel</button>
                        </div>
                      </>
                    )}
                    {passwordMessage && <div className="promo-success">{passwordMessage}</div>}
                    {passwordError && <div className="promo-error">{passwordError}</div>}
                  </div>
                )}
                {saved && <div className="promo-success">✅ Profile saved successfully!</div>}
                {profileError && <div className="promo-error">{profileError}</div>}
                <button onClick={save} disabled={profileBusy}>{profileBusy ? 'Saving...' : 'Save changes'}</button>
              </div>
              <hr style={{ margin: '28px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
              <div className="danger-zone">
                <h3>Danger zone</h3>
                {!deletingAccount ? (
                  <button className="danger-btn" onClick={() => setDeletingAccount(true)}><Trash2 size={14} /> Delete account</button>
                ) : (
                  <div className="account-delete-box">
                    <strong>Delete your account</strong>
                    <p>Your personal details will be anonymized and you will be signed out. Booking records are retained for business records.</p>
                    {!deletionCodeSent ? (
                      <div className="password-change-actions">
                        <button type="button" className="danger-btn" onClick={requestDeletionCode} disabled={deletionBusy}>{deletionBusy ? 'Sending code...' : 'Email deletion code'}</button>
                        <button type="button" className="secondary" onClick={() => setDeletingAccount(false)}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <div className="input-wrap"><KeyRound size={16} /><input inputMode="numeric" maxLength={6} placeholder="Enter the 6-digit deletion code" value={deletionCode} onChange={e => setDeletionCode(e.target.value.replace(/\D/g, '').slice(0, 6))} /></div>
                        <div className="password-change-actions">
                          <button type="button" className="danger-btn" onClick={confirmDeletion} disabled={deletionBusy}>{deletionBusy ? 'Deleting...' : 'Confirm account deletion'}</button>
                          <button type="button" className="secondary" onClick={requestDeletionCode} disabled={deletionBusy}>Resend code</button>
                          <button type="button" className="secondary" onClick={() => setDeletingAccount(false)}>Cancel</button>
                        </div>
                      </>
                    )}
                    {deletionMessage && <div className="promo-success">{deletionMessage}</div>}
                    {deletionError && <div className="promo-error">{deletionError}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'family' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Family members</h2>
                <button onClick={() => setAddingMember(true)}><Plus size={16} /> Add member</button>
              </div>
              <div className="family-list">
                {family.map(m => (
                  <div className="family-card" key={m.id}>
                    <Avatar name={m.name} size={48} />
                    <div>
                      <strong>{m.name}</strong>
                      <p>{m.relation} · {m.gender}{m.age ? ` · Age ${m.age}` : ''}</p>
                      {m.hairType && <p style={{ fontSize: 12 }}>Hair: {m.hairType}</p>}
                      {m.allergies && <p style={{ fontSize: 12 }}>Allergies: {m.allergies}</p>}
                    </div>
                    <div className="family-actions">
                      <button onClick={() => setPage('booking', {})}>Book</button>
                      <button className="ghost" onClick={() => setFamily(f => f.filter(x => x.id !== m.id))}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              {addingMember && (
                <div className="add-member-form">
                  <h3>Add family member</h3>
                  <div className="two-col">
                    <div><label>Name</label><input value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} placeholder="Family member full name" /></div>
                    <div><label>Relation</label><select value={newMember.relation} onChange={e => setNewMember(p => ({ ...p, relation: e.target.value }))}><option>Child</option><option>Partner</option><option>Parent</option><option>Sibling</option></select></div>
                  </div>
                  <div className="two-col">
                    <div><label>Gender</label><select value={newMember.gender} onChange={e => setNewMember(p => ({ ...p, gender: e.target.value }))}><option>Female</option><option>Male</option></select></div>
                    <div><label>Age (if child)</label><input type="number" value={newMember.age} onChange={e => setNewMember(p => ({ ...p, age: e.target.value }))} placeholder="Age in years, optional" /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button onClick={addMember}>Add member</button>
                    <button className="secondary" onClick={() => setAddingMember(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'rewards' && (
            <div className="profile-section">
              <h2>Loyalty rewards</h2>
              <div className="rewards-card">
                <div className="points-big">🏆 {profile.points || 450} pts</div>
                <div className="points-tier">Silver tier · {1500 - (profile.points || 450)} pts to Gold</div>
                <div className="points-bar"><div style={{ width: `${((profile.points || 450) / 1500) * 100}%` }}></div></div>
              </div>
              <div className="rewards-list">
                {[['Earn 10 pts', 'per ₦1,000 spent'], ['Get ₦500 off', 'at 500 points'], ['Free Service', 'at 2,000 points'], ['VIP Access', 'at 5,000 points']].map(([t, d]) => (
                  <div className="reward-item" key={t}><strong>{t}</strong><span>{d}</span></div>
                ))}
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="profile-section">
              <h2>Notification preferences</h2>
              <p className="profile-section-note">Choose how GlowBelle should contact you about booking confirmations, reminders, offers and stylist availability.</p>
              <div className="notif-list">
                <NotifRow label="Email confirmations" checked={notifications.emailConfirmations} onChange={value => setNotifications(p => ({ ...p, emailConfirmations: value }))} />
                <NotifRow label="SMS reminders" checked={notifications.smsReminders} onChange={value => setNotifications(p => ({ ...p, smsReminders: value }))} />
                <NotifRow label="WhatsApp updates" checked={notifications.whatsappUpdates} onChange={value => setNotifications(p => ({ ...p, whatsappUpdates: value }))} />
                <NotifRow label="Promo & offers" checked={notifications.promotions} onChange={value => setNotifications(p => ({ ...p, promotions: value }))} />
                <NotifRow label="Stylist availability" checked={notifications.stylistAvailability} onChange={value => setNotifications(p => ({ ...p, stylistAvailability: value }))} />
              </div>
              <button className="settings-save-btn" onClick={saveNotifications} disabled={notificationBusy}>{notificationBusy ? 'Saving...' : 'Save notification settings'}</button>
              {notificationMessage && <div className="promo-success">{notificationMessage}</div>}
              {notificationError && <div className="promo-error">{notificationError}</div>}
            </div>
          )}

        </main>
      </div>
    </>
  );
}
