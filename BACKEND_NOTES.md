# Backend work added

I added a production-ready starting backend using Node.js, Express, MongoDB and Mongoose.

## What is included

- Express API app in `server/`
- MongoDB connection via Mongoose
- Auth with JWT and bcrypt password hashing
- Customer, stylist and admin roles
- Models for users, services, stylists, bookings, branches, offers, gallery, reviews and contact messages
- Public endpoints for services, stylists, branches, offers, gallery and reviews
- Booking creation endpoint with pricing, travel fee, promo code validation and stylist conflict checking
- Admin endpoints for dashboard stats, all bookings and customers
- Seed script using your existing frontend salon data
- Vite proxy from frontend `/api` to backend `localhost:5000`
- Frontend API helper in `src/api.js`
- Confirm booking page now sends booking data to the backend

## Run it

From the project root:

```bash
npm install
npm --prefix server install
cp .env.example .env
cp server/.env.example server/.env
npm run server:seed
npm run dev:full
```

Or run frontend/backend separately:

```bash
npm run dev
npm run server
```

## Demo accounts after seeding

```txt
Admin: admin@glowbelle.com / Admin123!
Stylist: stylist@glowbelle.com / Stylist123!
Customer: customer@glowbelle.com / Customer123!
```
