import 'dotenv/config';
import { verifyEmailTransport } from '../services/notificationService.js';

try {
  await verifyEmailTransport();
  console.log('SMTP OK: email login accepted');
} catch (error) {
  console.error(`SMTP FAILED: ${error.message}`);
  process.exit(1);
}
