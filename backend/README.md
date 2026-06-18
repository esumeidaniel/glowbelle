# GlowBelle Backend

Node.js + Express + MongoDB/Mongoose API for the GlowBelle salon booking platform.

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

The API runs at `http://localhost:5000/api` by default.

## Authentication features

- `POST /api/auth/register` — creates a customer account and sends a 6-digit email verification code.
- `POST /api/auth/verify-email` — verifies the registration code and logs the user in.
- `POST /api/auth/resend-verification` — sends another verification code.
- `POST /api/auth/login` — blocks unverified local accounts and sends a new verification code.
- `POST /api/auth/forgot-password` — sends a 6-digit password reset code.
- `POST /api/auth/reset-password` — verifies the reset code, changes the password, and logs the user in.
- `POST /api/auth/google` — logs in or creates a customer account with Google.

Verification and reset codes expire after 10 minutes.

In development, if SMTP is not configured, email sending is skipped and the codes are printed in the backend terminal. For production, add real SMTP values in `.env`.

## Main endpoints

- `GET /api/auth/me`
- `GET /api/services`
- `GET /api/services/:id`
- `GET /api/stylists`
- `GET /api/stylists/:id`
- `GET /api/bookings/my-bookings`
- `POST /api/bookings`
- `PATCH /api/bookings/:id/status`
- `GET /api/admin/stats`
- `GET /api/admin/bookings`

Use the seeded admin login:

```txt
email: admin@glowbelle.com
password: Admin123!
```

Seeded stylist login:

```txt
email: stylist@glowbelle.com
password: Stylist123!
```

Seeded customer login:

```txt
email: customer@glowbelle.com
password: Customer123!
```
