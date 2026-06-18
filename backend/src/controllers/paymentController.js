import crypto from 'crypto';
import Booking from '../models/Booking.js';
import { initializePaystackTransaction, verifyPaystackTransaction } from '../services/paymentService.js';
import { sendStatusNotification } from '../services/notificationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function assertGuestPaymentAccess(req, booking) {
  if (booking.customer) return;
  const token = req.get('x-guest-payment-token') || req.body?.guestPaymentToken;
  const suppliedHash = token && crypto.createHash('sha256').update(token).digest('hex');
  const expectedHash = booking.guestPaymentTokenHash;
  if (!suppliedHash || !expectedHash || suppliedHash.length !== expectedHash.length
    || !crypto.timingSafeEqual(Buffer.from(suppliedHash), Buffer.from(expectedHash))) {
    const error = new Error('Guest payment authorization is invalid');
    error.statusCode = 403;
    throw error;
  }
}

export function validateTransaction(transaction, booking) {
  if (transaction.reference !== booking.paymentReference
    || Number(transaction.amount) !== Math.round(booking.total * 100)
    || transaction.currency !== 'NGN') {
    const error = new Error('Payment details do not match this booking');
    error.statusCode = 400;
    throw error;
  }
}

async function applySuccessfulPayment(transaction) {
  const booking = await Booking.findOne({ paymentReference: transaction.reference });
  if (!booking) return null;
  validateTransaction(transaction, booking);
  if (transaction.status !== 'success' || booking.paymentStatus === 'paid') return booking;
  booking.paymentStatus = 'paid';
  booking.status = booking.status === 'pending' ? 'confirmed' : booking.status;
  booking.paidAt = new Date(transaction.paid_at || Date.now());
  await booking.save();
  await sendStatusNotification(booking);
  return booking;
}

export const initializePayment = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId)
    .select('+guestPaymentTokenHash')
    .populate('customer', 'email name')
    .populate('service', 'title')
    .populate({ path: 'stylist', select: 'name payout +payout.paystackSubaccountCode' });
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const owner = booking.customer?._id?.toString() === req.user?._id?.toString();
  if (req.user && !owner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You cannot pay for this booking');
  }
  if (!req.user && booking.customer) {
    res.status(401);
    throw new Error('Sign in to pay for this booking');
  }
  assertGuestPaymentAccess(req, booking);
  if (booking.paymentStatus === 'paid') {
    res.status(409);
    throw new Error('This booking is already paid');
  }

  const email = booking.customer?.email || booking.guest?.email;
  if (!email) {
    res.status(400);
    throw new Error('Customer email is required for online payment');
  }
  const subaccount = booking.stylist?.payout?.paystackSubaccountCode;
  if (!subaccount || booking.stylist?.payout?.status !== 'active') {
    res.status(409);
    throw new Error('This stylist has not configured online payouts. Choose pay at salon.');
  }

  const reference = `GBPAY-${booking.bookingNumber}-${Date.now()}`;
  const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || process.env.CLIENT_URL;
  const transaction = await initializePaystackTransaction({
    email,
    amount: booking.total,
    reference,
    callbackUrl,
    metadata: {
      bookingId: booking._id.toString(),
      bookingNumber: booking.bookingNumber,
      service: booking.service?.title,
    },
    subaccount,
  });

  booking.paymentMethod = 'pay-card';
  booking.paymentProvider = 'paystack';
  booking.paymentReference = reference;
  await booking.save();

  res.json({ success: true, data: transaction });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const transaction = await verifyPaystackTransaction(reference);
  const booking = await Booking.findOne({ paymentReference: reference });
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found for this payment reference');
  }

  validateTransaction(transaction, booking);
  if (transaction.status === 'success') {
    await applySuccessfulPayment(transaction);
  } else {
    booking.paymentStatus = 'failed';
    await booking.save();
  }

  res.json({ success: true, data: { booking, transaction } });
});

export const paystackWebhook = asyncHandler(async (req, res) => {
  const signature = req.get('x-paystack-signature') || '';
  const expected = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '').update(req.body).digest('hex');
  if (!signature || signature.length !== expected.length
    || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    res.status(401);
    throw new Error('Invalid Paystack webhook signature');
  }
  const event = JSON.parse(req.body.toString('utf8'));
  if (event.event === 'charge.success') await applySuccessfulPayment(event.data);
  res.sendStatus(200);
});
