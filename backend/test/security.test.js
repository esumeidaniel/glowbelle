import test from 'node:test';
import assert from 'node:assert/strict';
import { intervalsOverlap, resolveAddons, timeToMinutes } from '../src/controllers/bookingController.js';
import { validateTransaction } from '../src/controllers/paymentController.js';
import User from '../src/models/User.js';
import Stylist from '../src/models/Stylist.js';

test('booking times support 12-hour and 24-hour input', () => {
  assert.equal(timeToMinutes('9:30 AM'), 570);
  assert.equal(timeToMinutes('12:00 PM'), 720);
  assert.equal(timeToMinutes('14:45'), 885);
  assert.equal(timeToMinutes('25:00'), null);
});

test('duration-aware overlap catches partial conflicts but permits adjacent bookings', () => {
  assert.equal(intervalsOverlap(600, 720, 660, 780), true);
  assert.equal(intervalsOverlap(600, 720, 720, 780), false);
  assert.equal(intervalsOverlap(720, 780, 600, 720), false);
});

test('add-on prices always come from the service record', () => {
  const service = { addons: [{ name: 'Deep conditioning', price: 5000 }] };
  assert.deepEqual(resolveAddons(service, [{ name: 'Deep conditioning', price: 1 }]), [
    { name: 'Deep conditioning', price: 5000 },
  ]);
  assert.throws(() => resolveAddons(service, [{ name: 'Unknown', price: 0 }]), /invalid/);
});

test('Paystack transaction must match reference, amount, and NGN currency', () => {
  const booking = { paymentReference: 'GBPAY-123', total: 18000 };
  assert.doesNotThrow(() => validateTransaction({ reference: 'GBPAY-123', amount: 1800000, currency: 'NGN' }, booking));
  assert.throws(() => validateTransaction({ reference: 'GBPAY-123', amount: 100, currency: 'NGN' }, booking), /do not match/);
  assert.throws(() => validateTransaction({ reference: 'GBPAY-123', amount: 1800000, currency: 'USD' }, booking), /do not match/);
});

test('normal accounts default to customer and stylist applications default to pending', () => {
  const customer = new User({ name: 'Customer', email: 'customer@example.com', password: 'secret1' });
  const applicant = new Stylist({ code: 'test-stylist', name: 'Stylist', role: 'Stylist' });
  assert.equal(customer.role, 'customer');
  assert.equal(applicant.approvalStatus, 'pending');
});

test('stylist approval states reject unknown values', async () => {
  const applicant = new Stylist({ code: 'invalid-status', name: 'Stylist', role: 'Stylist', approvalStatus: 'self-approved' });
  await assert.rejects(applicant.validate(), /approvalStatus/);
});
