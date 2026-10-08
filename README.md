# Bambam Chicken — Integrated Ordering and Restaurant Management System (Frontend Prototype)

Clickable pitch prototype: customer ordering, POS, kitchen, payments, cash drawer, inventory, analytics and staff management in one platform.

**Frontend only.** There is no database, backend, real login, payment gateway, SMS, push notification, file storage or AI service. All data is fictional mock data kept in the browser.

## Run it

```bash
npm install              # first time only
npm run dev -- -H 0.0.0.0   # then open http://localhost:3000
```

Requires Node.js 20+. If pages ever return 404 or the terminal shows a "panicked" error: stop the server, delete the `.next` folder, start again.

## Pitch scenarios

Open the **customer app** (`/customer`) in a phone-sized window and the **staff screens** in another window of the same browser — they update each other live. Use the floating **Demo** button (bottom-left) to jump between views or reset the demo data.

| | Scenario | How |
|---|---|---|
| A | Walk-in group, guest, cash | POS → "Group order: add person" ×4 → add items per person (use **Duplicate**) → Cash ₱1000 → change shown → **D-052** |
| B | Walk-in GCash | POS → item → GCash → QR shown → **Mark payment verified & confirm** |
| C | Linked walk-in customer | POS → **Link Customer** → 0917 123 4567 → **LINK CUSTOMER** → confirm |
| D | Online pickup, Pay Now | Customer: menu → checkout → sign in (any code) → GCash → **Pay Now** → upload any image → submit → **P-028** (Pending Verification). Owner: Orders → Payments to verify → View proof → **Verify** → Needs confirmation → **Accept** |
| E | Online pickup, cash later | Customer: Cash at Pickup → place order. Owner accepts → Kitchen prepares/completes → Orders → open order → **Collect payment** → change → Paid. Cash Drawer updates |
| F | Restock | Inventory → tap Chicken → **Add Stock** 5 kg → movement logged |
| G | Waste | Inventory → **Actions** → Record Spoilage → Chicken 0.75 kg |
| H | Bambam chat | Tap the floating **Bambam** on any page. Try "View as: Kitchen Staff" and ask about revenue — it refuses |
| — | AI Quick Order | POS → **AI QUICK ORDER** → try the demo examples (it asks instead of guessing, and never submits by itself) |
| — | Now Serving | `/now-serving` on a TV/tablet: Preparing → Completed — please claim |

## Key ideas

- **Order channel** (Online / Walk-in) and **order type** (Dine-In / Takeout / Pickup / Delivery) are separate fields.
- **Four identifiers:** Order ID `ORD-20261008-00152`, Queue number `D-052`, Payment ID `PAY-20261008-00152`, Customer ID `CUS-000428` (only for known customers — guests have none).
- **Payment status is separate from order status.** GCash never means "paid" until someone verifies it.
- **Revenue = completed order totals.** Cash received and change are not revenue. The cash drawer is tracked separately.
- **Kitchen statuses:** Confirmed → Preparing → Completed. There is no "Ready" status.

## Where things live

```
src/
├── app/                   Pages (Next.js App Router)
│   ├── customer/          Customer app
│   ├── admin/             Staff side: dashboard, pos, orders, cash, kitchen, inventory, …
│   ├── auth/              Simulated sign-in (customer OTP, staff password + 2FA)
│   └── now-serving/       Counter TV screen
├── components/
│   ├── shared/            Mascot, badges, payment panels, Bambam chat, notifications…
│   ├── customer/          Customer-only pieces
│   ├── admin/             Staff-only pieces (admin/pos/ = the POS)
│   └── ui/                shadcn/ui components
├── data/                  ← ALL mock data (orders, customers, inventory, cash, payments…)
│   └── demo-config.ts     ← unconfirmed business values (fees, slots, payment methods…)
├── lib/
│   ├── actions/           ← the mock "API": orders, payments, inventory, cash, customers
│   ├── demo-state.ts      Shape of all demo data + starting values
│   ├── store.tsx          Connects actions to React, saves to localStorage, syncs tabs
│   ├── permissions.ts     Which role can see/do what
│   ├── quick-order-parser.ts  Simulated AI Quick Order
│   └── chat-responder.ts  Scripted, role-aware Bambam answers
└── types/                 TypeScript interfaces (Order, Payment, Customer, …)
```

When the FastAPI backend exists, each function in `lib/actions/` becomes an API call; the pages don't need to change much.

## Still needs owner decisions

Menu, prices and options · inventory units, thresholds, costs and recipe amounts · pickup capacity · fees · supported payment methods and the official payment QR · whether managers see financial data · queue priority rules · loyalty rules · delivery workflow · refund rules · mascot name.
