# GlowBelle — Separated Frontend and Backend

This version has the website split into two clean folders:

```txt
frontend/  -> React + Vite customer/admin website
backend/   -> Node.js + Express + MongoDB API
```

## Run locally

### 1. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at:

```txt
http://localhost:5173
```

### 2. Backend

Open another terminal:

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

Backend runs at:

```txt
http://localhost:5000
```

Health check:

```txt
http://localhost:5000/api/health
```

## Important local env values

`frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

`backend/.env`

```env
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/glowbelle
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

## Deployment

Recommended setup:

```txt
Frontend -> Vercel, root directory: frontend
Backend  -> Render, root directory: backend
Database -> MongoDB Atlas
```

On Vercel, add:

```env
VITE_API_URL=https://your-render-backend-url.onrender.com/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

On Render, add the variables from `backend/.env.example`, especially:

```env
MONGO_URI=
JWT_SECRET=
CLIENT_URL=https://your-vercel-frontend-url.vercel.app
GOOGLE_CLIENT_ID=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

Launch payment mode is Pay at Salon only. Card payment variables are not required.
