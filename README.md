# BelzGraphics — design shop

Mobile-first shop for BelzGraphics: customers browse designs, view samples, then either pay a deposit
with Paystack or send their order/brief to WhatsApp. Admin manages designs, categories and orders.

Stack: Next.js 15 (App Router) · Tailwind v4 · Prisma + Postgres · Cloudinary · Paystack.

## 1. Setup

```bash
npm install
cp .env.example .env.local      # then fill it in (see below)
cp .env.local .env              # Prisma CLI reads .env
npm run db:push                 # creates the tables
npm run db:seed                 # adds Flyers, Logos, Branding, Merch, Videos, Custom
npm run dev
```

Open http://localhost:3000 for the shop and http://localhost:3000/admin for the admin.

## 2. Environment variables

| Variable | Where to get it |
| --- | --- |
| `DATABASE_URL` | Neon (neon.tech) → new project → connection string |
| `ADMIN_PASSWORD` | Any strong password; this is your admin login |
| `AUTH_SECRET` | Random 32+ chars: `openssl rand -base64 32` |
| `PAYSTACK_SECRET_KEY` | Paystack dashboard → Settings → API Keys & Webhooks (use `sk_test_` first) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary dashboard |
| `NEXT_PUBLIC_CLOUDINARY_REFS_PRESET` | Cloudinary → Settings → Upload → add an **unsigned** preset, folder `belzgraphics/refs` |

Never commit `.env` / `.env.local`, and never paste the secret keys anywhere public.

## 3. Paystack webhook

Paystack dashboard → Settings → API Keys & Webhooks → Webhook URL:

```
https://graphics.afeeztemitope.com/api/paystack/webhook
```

The order page also double-checks payment with Paystack when the customer returns, so orders still
get marked paid if the webhook is slow.

## 4. Deploy (Vercel)

1. Push to GitHub, import the repo in Vercel, add all env vars (production values).
2. Vercel → Domains → add `graphics.afeeztemitope.com`.
3. At your DNS provider add `CNAME graphics → cname.vercel-dns.com`.
4. Run `npm run db:push` once against the production database.

## How it works

- **Fixed-price designs**: customer picks a package → pays the deposit (Paystack) or sends the order to WhatsApp.
  Orders are saved first, so every WhatsApp message carries an order ref (e.g. `BG-3F9A21C0`).
- **Quote designs** (branding, custom): no checkout; customer sends a brief to WhatsApp, saved as “Needs quote”.
- **Media**: admin uploads go straight to Cloudinary (signed); you can also paste existing Cloudinary URLs.
  Images and videos are served through Cloudinary with `f_auto,q_auto`, so they're optimised for mobile data.
- **Install as an app**: the site has a web manifest, so “Add to Home Screen” opens it full-screen.

## Folder map

```
src/app/(shop)            customer pages: shop, design page, about, contact, order status
src/app/admin             login + panel (designs, categories, orders) and server actions
src/app/actions/order.ts  creates orders, starts Paystack or builds the WhatsApp message
src/app/api               Paystack webhook, Cloudinary upload signing
src/components            UI (Gallery, OrderPanel, DesignCard, admin/DesignForm…)
src/lib                   prisma, paystack, cloudinary helpers, site config (phone, email, handles)
prisma/schema.prisma      Category, Design, Media, Package, Order
```

Contact details and social handles live in `src/lib/site.ts`.
