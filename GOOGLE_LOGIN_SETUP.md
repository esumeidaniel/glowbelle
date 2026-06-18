# Google login setup

Google login has been added to the website. It uses Google Identity Services on the frontend and verifies the Google ID token securely on the Express backend before creating or logging in the customer.

## 1. Create a Google OAuth client

1. Go to Google Cloud Console.
2. Create or select a project.
3. Open **APIs & Services → OAuth consent screen**.
4. Configure the app name, support email and developer contact email.
5. Open **APIs & Services → Credentials**.
6. Create **OAuth client ID**.
7. Choose **Web application**.
8. Add your frontend domains under **Authorized JavaScript origins**.

For local development, add:

```txt
http://localhost:5173
```

For production, add your real Vercel/custom domain, for example:

```txt
https://your-salon-website.vercel.app
https://yourdomain.com
```

## 2. Add environment variables

Frontend `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

Backend `server/.env`:

```env
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

The frontend and backend must use the same Google client ID.

## 3. Add production environment variables

On Vercel, add:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

On Render, add:

```env
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

Then redeploy both services.

## 4. How it works

- Customer clicks **Sign in with Google**.
- Google returns an ID token to the frontend.
- Frontend sends the token to `/api/auth/google`.
- Backend verifies the token with Google.
- Backend creates a customer account if the email is new.
- Backend links Google to an existing account if the email already exists.
- Backend returns your normal JWT token for the website session.

## 5. Test checklist

- Visit the login page locally.
- Confirm the Google button appears.
- Sign in with a Gmail account.
- Confirm you are redirected to the homepage.
- Check MongoDB `users` collection for the new customer account.
- Test again on the live website after adding the production domain to Google Cloud.
