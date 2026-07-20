# Dollars Food

Static restaurant website for **Dollars Food** — everything for $1.

## Live site

- **Vercel:** https://one-dollar-food.vercel.app
- **GitHub:** https://github.com/ali-1825/One-Dollar-food

## Stack

- Static HTML + Tailwind CSS (CDN) + vanilla JavaScript
- Vercel serverless function: `POST /api/order` (TypeScript)

## Pages

| Route | File |
|-------|------|
| `/` | Main Page |
| `/menu` | Full menu |
| `/detail` | Product detail |
| `/stash` | Cart |
| `/checkout` | Checkout |

## Orders

Checkout and the home order form submit to `POST /api/order`. The server:

1. Validates the order and recalculates totals from the server-side menu catalog
2. Generates an order ID (for example `ORD-20260720-A1B2C3`)
3. Sends a structured WhatsApp notification to the business number
4. Sends an approved WhatsApp template confirmation to the customer

WhatsApp credentials stay on the server only. They are never exposed in browser code.

## Environment variables

Copy `.env.example` to `.env.local` for local development, or add the same variables in the Vercel project settings for production:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
BUSINESS_WHATSAPP_NUMBER=923245972524
WHATSAPP_API_VERSION=v21.0
WHATSAPP_CUSTOMER_TEMPLATE_NAME=order_confirmation
WHATSAPP_TEMPLATE_LANGUAGE=en_US
```

Do not prefix secret values with `NEXT_PUBLIC_` or `VITE_`.

### Customer template

Create and approve a WhatsApp template named `order_confirmation` (or match `WHATSAPP_CUSTOMER_TEMPLATE_NAME`) with body parameters:

1. Order ID
2. Customer name
3. Order total (PKR)
4. Payment method

## Local development

Install dependencies:

```bash
npm install
```

Run TypeScript checks:

```bash
npm run lint
npm run build
```

Run the site and API together with Vercel:

```bash
npx vercel dev
```

Then open the local URL shown by Vercel (usually `http://localhost:3000`).

### Test the API locally

```bash
curl -X POST http://localhost:3000/api/order ^
  -H "Content-Type: application/json" ^
  -d "{\"customerName\":\"Test User\",\"phone\":\"03245972524\",\"address\":\"123 Test Street, Karachi\",\"items\":[{\"id\":\"double-dollar-smash\",\"quantity\":2}],\"paymentMethod\":\"Cash on Delivery\",\"notes\":\"Test order\",\"_honeypot\":\"\"}"
```

Expected success response:

```json
{
  "success": true,
  "orderId": "ORD-20260720-XXXXXX",
  "message": "Your order has been received."
}
```

### Test in the browser

1. Start `npx vercel dev`
2. Add items from `/menu`
3. Go to `/checkout`
4. Fill in name, phone, address, and confirm the order
5. Check the business WhatsApp number for the notification

## Deploy

Push to `main` on GitHub. Vercel deploys automatically.

```bash
npx vercel --prod
```

After deployment, confirm the same environment variables are set in the Vercel dashboard, then place a test order on the live site.
