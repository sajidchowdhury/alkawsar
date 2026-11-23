# AL-KAWSAR — VPS Deployment Guide

Deploy the website to your own VPS so it is served at:

**https://inventoryos.xyz/alkawsar**

The project already supports sub-path hosting out of the box: it reads
`NEXT_PUBLIC_BASE_PATH=/alkawsar` at build time, so every route, image and API
call works under the `/alkawsar` folder while the rest of `inventoryos.xyz`
keeps running untouched.

---

## 0. What you need

| Item | Notes |
|---|---|
| A VPS | Ubuntu 22.04/24.04, at least 1 GB RAM |
| SSH access | `ssh root@YOUR_VPS_IP` |
| Domain | `inventoryos.xyz` must already point to this VPS (A record) |
| Existing site | `inventoryos.xyz` root is assumed to already serve something via **nginx** — we only add one `location` block to it |

---

## 1. Prepare the server (one time)

```bash
# Node.js 20+ (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx sqlite3

# PM2 — keeps the app running and restarts it after reboot
sudo npm i -g pm2
```

If nginx is not installed yet, the step above installs it. If the domain is
already served by nginx, keep your existing config — we will only ADD a
location block in step 6.

---

## 2. Upload the project

### Option A — pull from GitHub (recommended)

```bash
sudo mkdir -p /var/www && cd /var/www
sudo git clone https://github.com/sajidchowdhury/alkawsar.git alkawsar
sudo chown -R $USER:$USER /var/www/alkawsar
cd /var/www/alkawsar
```

### Option B — upload from your computer (if the repo is private)

```bash
# on your PC (Git Bash / terminal), from the project folder:
scp -r . root@YOUR_VPS_IP:/var/www/alkawsar
```

---

## 3. Configure environment

```bash
cd /var/www/alkawsar
cp .env.example .env
nano .env
```

Set these three values:

```env
DATABASE_URL=file:/var/www/alkawsar/db/custom.db
NEXT_PUBLIC_BASE_PATH=/alkawsar
ADMIN_PASSWORD=YOUR-STRONG-PASSWORD
```

- `DATABASE_URL` — absolute path; the `db/` folder will be created automatically.
- `NEXT_PUBLIC_BASE_PATH` — **must be set before building**; it is baked into
  the app. This is what makes the site work under `/alkawsar`.
- `ADMIN_PASSWORD` — this unlocks the owner panel (the small lock icon in the
  footer). Use something strong; anyone with it can change the live prices.

Also set a random admin cookie secret:

```env
ADMIN_SECRET=any-long-random-string
```

---

## 4. Install dependencies, create the database, build

```bash
cd /var/www/alkawsar
npm install
npm run db:push        # creates db/custom.db and auto-seeds products/prices
NEXT_PUBLIC_BASE_PATH=/alkawsar npm run build
```

> The env var must be present at **build** time (that is when Next.js inlines
> it). Passing it on the same line as `npm run build`, exactly as above, is the
> safest way.

The build outputs a standalone server. Verify it boots:

```bash
PORT=3005 HOSTNAME=127.0.0.1 NODE_ENV=production node .next/standalone/server.js
# in another terminal:
curl -I http://127.0.0.1:3005/alkawsar        # expect HTTP/1.1 200 OK
curl    http://127.0.0.1:3005/alkawsar/api/prices   # expect JSON with products
# stop it with Ctrl+C
```

---

## 5. Keep it running with PM2

```bash
cd /var/www/alkawsar
PORT=3005 HOSTNAME=127.0.0.1 NODE_ENV=production pm2 start .next/standalone/server.js --name alkawsar
pm2 save
pm2 startup          # follow the printed instruction (usually one sudo command)
```

Useful commands:

```bash
pm2 status           # is it online?
pm2 logs alkawsar    # live logs
pm2 restart alkawsar
```

The app now listens on **127.0.0.1:3005** — internal only, not reachable from
the internet directly. Nginx is the public front door.

---

## 6. Add the `/alkawsar` block to nginx

Open your existing nginx config for the domain (it already serves
`inventoryos.xyz`):

```bash
sudo nano /etc/nginx/sites-available/inventoryos.xyz
```

Find the `server {` block that listens on 80/443 for `inventoryos.xyz` and add
this **inside** it (next to the other `location` blocks):

```nginx
    location /alkawsar {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

**Important:** keep `proxy_pass http://127.0.0.1:3005;` WITHOUT a trailing
slash — the app itself expects the `/alkawsar` prefix, so the full path must
be forwarded.

Then test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

If nginx has no config for this domain yet, create
`/etc/nginx/sites-available/inventoryos.xyz`:

```nginx
server {
    listen 80;
    server_name inventoryos.xyz www.inventoryos.xyz;

    location /alkawsar {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ... keep / keep your other app's locations here ...
}
```

and enable it:

```bash
sudo ln -s /etc/nginx/sites-available/inventoryos.xyz /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. HTTPS (skip if the domain already has SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d inventoryos.xyz -d www.inventoryos.xyz
```

If SSL is already configured for `inventoryos.xyz`, nothing more is needed —
your new `/alkawsar` location is automatically served over HTTPS too.

---

## 8. Done — verify

Open in a browser:

- **https://inventoryos.xyz/alkawsar** → the landing page with the hero slider
- Prices load automatically (green “TODAY'S PRICE” section shows rates)
- Footer → small **lock icon** → owner panel → enter `ADMIN_PASSWORD` → update prices/stock → Save → the public page updates within seconds

Final checks from the server:

```bash
curl -I https://inventoryos.xyz/alkawsar
curl -s https://inventoryos.xyz/alkawsar/api/prices | head -c 200
```

---

## 9. Updating the site later (after code changes are pushed to GitHub)

```bash
cd /var/www/alkawsar
git pull origin main
npm install                 # only if dependencies changed
NEXT_PUBLIC_BASE_PATH=/alkawsar npm run build
pm2 restart alkawsar
```

Prices/stock changes do **not** need a deploy — the owner panel updates them
live in the database.

---

## 10. Backup the database (recommended)

Everything editable (prices, stock, note) lives in one SQLite file:

```bash
cp /var/www/alkawsar/db/custom.db /root/backups/custom-$(date +%F).db
```

Add a cron job for a daily backup:

```bash
crontab -e
# add:
0 3 * * * cp /var/www/alkawsar/db/custom.db /root/backups/custom-$(date +\%F).db
```

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `/alkawsar` returns nginx 404 | The `location /alkawsar` block is missing, or nginx wasn't reloaded → step 6 |
| Page loads but CSS/JS/images 404 | The site was built without `NEXT_PUBLIC_BASE_PATH=/alkawsar` → rebuild (step 4) |
| Prices section stuck on loading | API fails: run `npm run db:push`, check `DATABASE_URL` is an absolute path, check `pm2 logs alkawsar` |
| Owner panel password rejected | The `ADMIN_PASSWORD` in `.env` on the VPS is different from the one you type; after changing it, `pm2 restart alkawsar` |
| App crashed | `pm2 logs alkawsar --lines 50`; most common: port 3005 already used — change `PORT` in the pm2 command and the nginx `proxy_pass` |
| Changed `.env` but nothing changed | Env changes need a restart: `pm2 restart alkawsar` (and a rebuild for `NEXT_PUBLIC_BASE_PATH`) |
