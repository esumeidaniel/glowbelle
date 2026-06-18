import { verifyEmailTransport } from '../services/notificationService.js';

const REQUIRED_PRODUCTION_ENV = [
  'MONGO_URI',
  'JWT_SECRET',
  'CLIENT_URL',
  'GOOGLE_CLIENT_ID',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
];

function isPlaceholder(value) {
  return !value || /^(your_|paste_|replace_|change_|make_this_|sk_test_)/i.test(String(value).trim());
}

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = REQUIRED_PRODUCTION_ENV.filter(key => isPlaceholder(process.env[key]));
  if (missing.length) {
    throw new Error(`Missing production environment variables: ${missing.join(', ')}`);
  }

  if (String(process.env.JWT_SECRET).length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
}

export async function verifyProductionServices() {
  if (process.env.NODE_ENV !== 'production') return;
  await verifyEmailTransport();
}
