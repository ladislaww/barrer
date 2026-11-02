# Deploy to VPS / Node.js Hosting

This project uses Next.js, Prisma, SQLite, and PM2. It is suitable for a VPS or Node.js hosting with persistent disk storage.

## Required Server Environment

- Node.js 20+
- npm
- persistent disk storage
- nginx or another reverse proxy
- SSL certificate

## Environment Variables

Create `.env` on the server:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.ru"
TELEGRAM_BOT_TOKEN=""
TELEGRAM_ADMIN_CHAT_ID=""
```

Do not commit real secrets.

## First Deploy

From your local machine:

```bash
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .env \
  --exclude prisma/dev.db \
  ./ $DEPLOY_USER@$DEPLOY_HOST:~/barrer-shop/
```

On the server:

```bash
cd ~/barrer-shop
npm install
npm run db:push
npm run db:seed
npm run build
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
```

Admin:

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before the first `npm run db:seed`.
If `ADMIN_PASSWORD` is unset, the seed generates one and prints it once.
Re-running the seed never resets an existing admin password.

```txt
/admin/login
```

## Nginx Example

```nginx
server {
  server_name your-domain.ru www.your-domain.ru;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## SQLite Backups

Run daily with cron:

```bash
cd ~/barrer-shop && sh scripts/backup-sqlite.sh
```

Example cron:

```cron
15 3 * * * cd $HOME/barrer-shop && sh scripts/backup-sqlite.sh >> backups/backup.log 2>&1
```

## Update Deploy

```bash
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .env \
  --exclude prisma/dev.db \
  ./ $DEPLOY_USER@$DEPLOY_HOST:~/barrer-shop/
```

Then on the server:

```bash
cd ~/barrer-shop
npm install
npm run db:push
npm run build
pm2 restart barrer-shop
```
