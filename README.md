# Dollars Food

Static restaurant website for **Dollars Food** — everything for $1.

## Live site

- **Vercel:** https://one-dollar-food.vercel.app
- **GitHub:** https://github.com/ali-1825/One-Dollar-food

## Pages

| Route | File |
|-------|------|
| `/` | Main Page |
| `/menu` | Full menu |
| `/detail` | Product detail |
| `/stash` | Cart |
| `/checkout` | Checkout |

## Local

Open `index.html` or `Main Page.html` in a browser.

## WhatsApp order notifications

Orders call `POST /api/send-order`, which sends order details to your WhatsApp via **Meta WhatsApp Cloud API**.

### 1. Local `.env`

Copy `.env.example` to `.env` and fill in:

```env
WHATSAPP_TOKEN=your_meta_whatsapp_cloud_api_token
WHATSAPP_PHONE_ID=your_whatsapp_business_phone_number_id
MY_WHATSAPP_NUMBER=923245972524
```

Run locally with:

```bash
npx vercel dev
```

### 2. Vercel production

In Vercel → Project → Settings → Environment Variables, add the same three variables for **Production**.

### 3. Meta setup

1. Create a Meta Developer app with WhatsApp product enabled.
2. Add your WhatsApp Business phone number and copy the **Phone number ID**.
3. Generate a permanent **Access token** with `whatsapp_business_messaging`.
4. Add `MY_WHATSAPP_NUMBER` as a test recipient in Meta (development) or use an approved template (production).

## Deploy

Push to `main` on GitHub. If Vercel Git integration is connected, production updates automatically.

Manual deploy:

```bash
npx vercel --prod
```
