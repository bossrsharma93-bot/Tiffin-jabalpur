# Production Deployment Guide (automated scaffold)

This repository contains a production-oriented scaffold for a tiffin marketplace app.
Files added: backend (Express + Knex + Postgres), mobile Expo app, admin dashboard scaffold, vendor APIs.

## High level steps to run locally (dev)
1. Copy `.env.example` to `api_server_node/.env` and fill secrets:
   - DATABASE_URL (e.g., postgres://postgres:postgres@db:5432/tiffin)
   - RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
   - FIREBASE_SERVICE_ACCOUNT_JSON (stringified JSON)
   - GOOGLE_MAPS_API_KEY, JWT_SECRET, APP_BASE_URL
2. Start docker-compose:
   ```bash
   docker-compose up -d --build
   ```
3. Run migrations:
   ```bash
   cd api_server_node
   npx knex --knexfile db/knexfile.js migrate:latest
   ```
4. Seed vendors (optional) or use vendor signup endpoint.
5. Start mobile Expo app:
   ```bash
   cd mobile_app_expo
   expo install
   expo start
   ```

## Production suggestions
- Use managed Postgres (Supabase, Railway, RDS).
- Keep secrets in env manager (DO NOT commit).
- Configure webhook URL in Razorpay dashboard and set `RAZORPAY_WEBHOOK_SECRET`.
- Set up SSL (Nginx + Let's Encrypt) and reverse proxy to API container.
- Set up backups and monitoring (Sentry, Prometheus).

## What remains to complete before public marketing
- Replace placeholder mobile flows (address picker map, full Firebase phone code flow verification)
- Implement items table & vendor item CRUD with image uploads
- Implement payouts processing (manual -> integrate RazorpayX)
- Finalize Play Store assets and privacy policy hosting

If you want, I can now implement any of the remaining items (items table + CRUD, payouts, full phone auth UX, admin UI polish) and produce an updated zip.
