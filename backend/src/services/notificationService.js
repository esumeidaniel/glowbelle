import nodemailer from 'nodemailer';

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function smtpValue(key) {
  const value = process.env[key]?.trim();
  if (key === 'SMTP_PASS' && process.env.SMTP_HOST?.includes('gmail.com')) {
    return value?.replace(/\s+/g, '');
  }
  return value;
}

function createTransporter() {
  if (!hasSmtpConfig()) return null;
  return nodemailer.createTransport({
    host: smtpValue('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: smtpValue('SMTP_USER'),
      pass: smtpValue('SMTP_PASS'),
    },
  });
}

export async function verifyEmailTransport() {
  const transporter = createTransporter();
  if (!transporter) throw new Error('SMTP is not configured');
  await transporter.verify();
}

export async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter();
  if (!transporter || !to) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[email skipped]', { to, subject });
    }
    return { skipped: true };
  }

  try {
    return await transporter.sendMail({
      from: process.env.EMAIL_FROM?.trim() || smtpValue('SMTP_USER'),
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    throw error;
  }
}

export async function sendVerificationCodeEmail({ to, name, code }) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[verification code] ${to}: ${code}`);
  }

  return sendEmail({
    to,
    subject: 'Verify your GlowBelle account',
    html: `
      <h2>Welcome to GlowBelle${name ? `, ${name}` : ''}</h2>
      <p>Use this code to verify your email address:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
      <p>This code expires in 10 minutes.</p>
    `,
    text: `Your GlowBelle verification code is ${code}. It expires in 10 minutes.`,
  });
}

export async function sendPasswordResetCodeEmail({ to, name, code }) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[password reset code] ${to}: ${code}`);
  }

  return sendEmail({
    to,
    subject: 'Reset your GlowBelle password',
    html: `
      <h2>Password reset request${name ? ` for ${name}` : ''}</h2>
      <p>Use this code to reset your GlowBelle password:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
      <p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
    `,
    text: `Your GlowBelle password reset code is ${code}. It expires in 10 minutes.`,
  });
}

export async function sendPasswordChangeCodeEmail({ to, name, code }) {
  return sendEmail({
    to,
    subject: 'Confirm your GlowBelle password change',
    html: `
      <h2>Password change request${name ? ` for ${name}` : ''}</h2>
      <p>Use this code to confirm that you want to change your GlowBelle password:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
      <p>This code expires in 10 minutes. If you did not request this change, secure your account immediately.</p>
    `,
    text: `Your GlowBelle password change code is ${code}. It expires in 10 minutes.`,
  });
}

export async function sendAccountDeletionCodeEmail({ to, name, code }) {
  return sendEmail({
    to,
    subject: 'Confirm deletion of your GlowBelle account',
    html: `
      <h2>Account deletion request${name ? ` for ${name}` : ''}</h2>
      <p>Use this code to permanently disable and anonymize your GlowBelle account:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
      <p>This code expires in 10 minutes. If you did not request deletion, do not share this code.</p>
    `,
    text: `Your GlowBelle account deletion code is ${code}. It expires in 10 minutes.`,
  });
}

export async function sendBookingNotifications(booking) {
  const populated = await booking.populate([
    { path: 'customer', select: 'name email phone' },
    { path: 'service', select: 'title price durationMinutes' },
    { path: 'stylist', select: 'name role user notificationPreferences', populate: { path: 'user', select: 'name email phone' } },
    { path: 'branch', select: 'name address' },
  ]);

  const customerName = populated.customer?.name || populated.guest?.name || 'Customer';
  const customerEmail = populated.customer?.email || populated.guest?.email;
  const customerPhone = populated.customer?.phone || populated.guest?.phone || 'Not provided';
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  const stylistEmail = populated.stylist?.user?.email;
  const stylistWantsBookingEmail = populated.stylist?.notificationPreferences?.bookingEmails !== false;
  const date = new Date(populated.appointmentDate).toLocaleDateString('en-NG', { dateStyle: 'medium' });
  const subject = `Booking ${populated.bookingNumber} - ${populated.service?.title}`;
  const details = `
    <p><strong>Booking:</strong> ${populated.bookingNumber}</p>
    <p><strong>Customer:</strong> ${customerName} (${customerPhone})</p>
    <p><strong>Service:</strong> ${populated.service?.title}</p>
    <p><strong>Stylist:</strong> ${populated.stylist?.name || 'Any available stylist'}</p>
    <p><strong>Date/time:</strong> ${date} at ${populated.startTime}</p>
    <p><strong>Location:</strong> ${populated.locationType === 'home' ? populated.homeAddress || 'Home service' : populated.branch?.name || 'Salon'}</p>
    <p><strong>Total:</strong> ₦${Number(populated.total || 0).toLocaleString('en-NG')}</p>
    <p><strong>Status:</strong> ${populated.status}</p>
  `;

  await Promise.allSettled([
    sendEmail({
      to: customerEmail,
      subject: `Your GlowBelle booking is received (${populated.bookingNumber})`,
      html: `<h2>Thanks, ${customerName}</h2><p>We received your booking. Our team will confirm it shortly.</p>${details}`,
    }),
    sendEmail({
      to: adminEmail,
      subject,
      html: `<h2>New booking received</h2>${details}`,
    }),
    stylistEmail && stylistWantsBookingEmail && sendEmail({
      to: stylistEmail,
      subject: `New appointment assigned to you (${populated.bookingNumber})`,
      html: `<h2>You have a new GlowBelle appointment</h2><p>This booking was assigned to you immediately and does not require admin approval.</p>${details}`,
      text: `New appointment ${populated.bookingNumber}: ${populated.service?.title} for ${customerName} on ${date} at ${populated.startTime}.`,
    }),
  ]);
}

export async function sendStatusNotification(booking) {
  const populated = await booking.populate([
    { path: 'customer', select: 'name email phone' },
    { path: 'service', select: 'title' },
  ]);
  const to = populated.customer?.email || populated.guest?.email;
  await sendEmail({
    to,
    subject: `GlowBelle booking ${populated.bookingNumber} is ${populated.status}`,
    html: `<h2>Booking update</h2><p>Your booking for <strong>${populated.service?.title}</strong> is now <strong>${populated.status}</strong>.</p>`,
  });
}
