import { assetUrl } from '../api.js';

export default function Avatar({ name = '', size = 56, src = '' }) {
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'GB';
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.3, flexShrink: 0, overflow: 'hidden' }}>
      {src ? <img src={assetUrl(src)} alt={name || 'Profile'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : initials}
    </div>
  );
}
