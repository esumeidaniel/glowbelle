const API_URL = import.meta.env.VITE_API_URL || '/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

function getToken() {
  return localStorage.getItem('glowbelle_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('glowbelle_token', token);
  else localStorage.removeItem('glowbelle_token');
}

export function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (String(path).startsWith('/images/')) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'API request failed');
  }

  return payload;
}

export async function downloadAdminDocument(applicationId, type) {
  const response = await fetch(`${API_URL}/admin/stylist-applications/${applicationId}/documents/${type}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'Unable to open verification document');
  }
  const url = URL.createObjectURL(await response.blob());
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export const glowbelleApi = {
  register: data => api('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  registerStylist: data => api('/auth/register-stylist', { method: 'POST', body: data }),
  login: data => api('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  googleLogin: credential => api('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  verifyEmail: data => api('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }),
  resendVerification: email => api('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPassword: email => api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: data => api('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  requestPasswordChange: () => api('/auth/change-password/request', { method: 'POST' }),
  confirmPasswordChange: data => api('/auth/change-password/confirm', { method: 'POST', body: JSON.stringify(data) }),
  me: () => api('/auth/me'),
  updateProfile: data => api('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
  requestAccountDeletion: () => api('/auth/delete-account/request', { method: 'POST' }),
  confirmAccountDeletion: code => api('/auth/delete-account/confirm', { method: 'POST', body: JSON.stringify({ code }) }),
  services: params => api(`/services${params ? `?${new URLSearchParams(params)}` : ''}`),
  service: id => api(`/services/${id}`),
  createService: data => api('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => api(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteService: id => api(`/services/${id}`, { method: 'DELETE' }),
  categories: () => api('/categories'),
  stylists: params => api(`/stylists${params ? `?${new URLSearchParams(params)}` : ''}`),
  myStylistBookings: () => api('/stylists/me/bookings'),
  payoutBanks: () => api('/stylists/me/payout-banks'),
  configurePayout: data => api('/stylists/me/payout', { method: 'PATCH', body: JSON.stringify(data) }),
  myStylistOffers: () => api('/stylists/me/offers'),
  createStylistOffer: data => api('/stylists/me/offers', { method: 'POST', body: JSON.stringify(data) }),
  updateStylistOffer: (id, data) => api(`/stylists/me/offers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteStylistOffer: id => api(`/stylists/me/offers/${id}`, { method: 'DELETE' }),
  updateMyOfferings: offerings => api('/stylists/me/offerings', { method: 'PUT', body: JSON.stringify({ offerings }) }),
  uploadOfferingImage: (serviceId, data) => api(`/stylists/me/offerings/${serviceId}/image`, { method: 'POST', body: data }),
  uploadStylistProfileImage: data => api('/stylists/me/profile-image', { method: 'POST', body: data }),
  updateMyStylistSettings: data => api('/stylists/me/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  uploadStylistPortfolio: data => api('/stylists/me/portfolio', { method: 'POST', body: data }),
  deleteStylistPortfolio: index => api(`/stylists/me/portfolio/${index}`, { method: 'DELETE' }),
  branches: () => api('/branches'),
  offers: () => api('/offers'),
  validateOffer: (code, params) => api(`/offers/${encodeURIComponent(code)}/validate${params ? `?${new URLSearchParams(params)}` : ''}`),
  gallery: params => api(`/gallery${params ? `?${new URLSearchParams(params)}` : ''}`),
  createBooking: data => {
    if (!data.inspirationImage) return api('/bookings', { method: 'POST', body: JSON.stringify(data) });
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'inspirationImage') form.append(key, value);
      else if (typeof value === 'object') form.append(key, JSON.stringify(value));
      else form.append(key, value);
    });
    return api('/bookings', { method: 'POST', body: form });
  },
  myBookings: () => api('/bookings/my-bookings'),
  cancelBooking: (id, reason) => api(`/bookings/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  contact: data => api('/contact', { method: 'POST', body: JSON.stringify(data) }),
  adminStats: () => api('/admin/stats'),
  adminBookings: params => api(`/admin/bookings${params ? `?${new URLSearchParams(params)}` : ''}`),
  adminCustomers: params => api(`/admin/customers${params ? `?${new URLSearchParams(params)}` : ''}`),
  adminStylistApplications: status => api(`/admin/stylist-applications${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  reviewStylistApplication: (id, data) => api(`/admin/stylist-applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateBookingStatus: (id, data) => api(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  initializePayment: (bookingId, guestPaymentToken) => api('/payments/initialize', {
    method: 'POST',
    body: JSON.stringify({ bookingId }),
    headers: guestPaymentToken ? { 'x-guest-payment-token': guestPaymentToken } : {},
  }),
  verifyPayment: reference => api(`/payments/verify/${encodeURIComponent(reference)}`),
};
