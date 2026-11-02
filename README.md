# Barrer Atelier

Next.js storefront with a built-in admin panel, customer accounts, Prisma, SQLite, Telegram notifications, and Auth.js credentials login.

This version does not use a CMS. Products, orders, and admin users are stored in the local SQL database file `prisma/dev.db`.

## Features

- Product catalog and product pages
- Cart with persistent localStorage state and image fallbacks
- Checkout with delivery address, comment, legal consent checkboxes, and stock validation
- Customer registration, login, profile editing, and order history
- Admin dashboard, product CRUD, order status management
- Product visibility toggle for hiding products from the storefront
- RU/EN language switcher with RUB/USD display conversion
- Telegram notification on new order

## Local Setup

```bash
npm install
cp .env.local.example .env
npm run db:push
npm run db:seed
npm run dev
```

Admin:

`npm run db:seed` creates the admin account and prints a generated password once.
Save it — it is not shown again. To choose the password yourself, set `ADMIN_EMAIL`
and `ADMIN_PASSWORD` before seeding.

```txt
http://localhost:3000/admin/login
```

Re-running the seed never resets an existing admin password.

## Environment

Copy `.env.example` or `.env.local.example` to `.env` and fill production values:

```txt
DATABASE_URL="file:./dev.db"
AUTH_SECRET="generated-secret"
NEXTAUTH_URL="https://your-domain.ru"
TELEGRAM_BOT_TOKEN=""
TELEGRAM_ADMIN_CHAT_ID=""
```

Do not commit real secrets.

## Hosting Notes

This project can run on a regular Node.js hosting or VPS where the app has persistent disk storage. Keep `prisma/dev.db` on persistent storage and back it up.

For serverless hosting without persistent disk, use PostgreSQL instead of SQLite.
