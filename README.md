# IAG Hub Services Supply Store

A production-grade headless Shopify storefront built as a portfolio project targeting a **Shopify eCommerce Engineer** role at IAG New Zealand.

## What This Project Demonstrates

| Capability | Implementation |
|---|---|
| Shopify Storefront API | Apollo Client + GraphQL queries/mutations against the Cart API |
| Headless cart management | React Context, localStorage persistence, real-time updates |
| Webhook ingestion | Express POST `/webhooks/orders/created` → in-memory ticket store |
| ServiceNow simulation | REST CRUD API (`/api/servicenow/tickets`) with status lifecycle |
| B2B procurement UX | Product filtering, variant selection, quantity controls |
| Monorepo tooling | pnpm workspaces + concurrently for client/server dev |

---

## Tech Stack

**Frontend (`/client`)**
- React 18 + TypeScript + Vite
- Tailwind CSS v3
- Apollo Client 3 (GraphQL)
- React Router v6
- shadcn/ui components (Button, Badge, Card, Select, Skeleton)
- Radix UI primitives
- lucide-react icons

**Backend (`/server`)**
- Node.js + Express + TypeScript
- `tsx` for zero-config dev server
- In-memory ticket store (no database required)
- CORS configured for `localhost:5173`

**Shopify**
- Storefront API 2024-01
- `mock.shop` for development (no API key required)
- Cart API for cart + checkout flow

---

## Project Structure

```
shopify-headless-storefront/
├── client/
│   └── src/
│       ├── apollo/client.ts          # ApolloClient → Storefront API
│       ├── graphql/                  # SDL files + gql DocumentNodes
│       │   ├── products.graphql
│       │   ├── cart.graphql
│       │   ├── checkout.graphql
│       │   └── index.ts             # Exported gql operations
│       ├── context/CartContext.tsx   # Cart state + Shopify mutations
│       ├── hooks/                    # useCart, useProduct, useCheckout
│       ├── components/
│       │   ├── ui/                  # shadcn/ui wrappers
│       │   ├── layout/              # Header, Footer, Nav
│       │   ├── product/             # ProductCard, Gallery, VariantSelector
│       │   └── cart/                # CartDrawer, CartItem, CartSummary
│       └── pages/                   # 6 routes (see below)
└── server/
    └── src/
        ├── routes/webhooks.ts        # POST /webhooks/orders/created
        ├── routes/servicenow.ts      # GET/POST/PATCH /api/servicenow/tickets
        ├── services/ticketStore.ts   # In-memory CRUD + status cycling
        └── index.ts                  # Express app
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Hero landing + featured products |
| `/products` | Full catalogue with type filters + sort |
| `/products/:handle` | Product detail — gallery, variant selector, add to cart |
| `/cart` | Cart page with line items + checkout redirect |
| `/order-confirm` | Post-checkout confirmation; polls for ServiceNow ticket |
| `/admin/tickets` | Admin view — all tickets, status cycling, auto-refresh |

---

## ServiceNow Integration Simulation

This project simulates the Shopify → ServiceNow integration pattern used in enterprise eCommerce:

```
Customer places order
        │
        ▼
Shopify fires orders/created webhook
        │
        ▼
POST /webhooks/orders/created  (Express server)
        │
        ▼
ticketStore.createTicket()  (in-memory)
        │
        ▼
/order-confirm page polls GET /api/servicenow/tickets
        │
        ▼
Ticket displayed with ID, status, summary
```

**In production**, this would call the actual ServiceNow REST Table API (`POST /api/now/table/incident`) using a service account token. The Express server acts as the integration middleware, decoupling Shopify from ServiceNow.

Status lifecycle: `open` → `processing` → `closed` (cycles on PATCH with no body).

---

## Setup

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Install

```bash
pnpm install
```

### Configure environment

```bash
# Client
cp client/.env.example client/.env

# Server
cp server/.env.example server/.env
```

The defaults point to `mock.shop` which requires no API credentials.

### Run (both client + server)

```bash
pnpm dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001
- Health check: http://localhost:3001/health

### Run individually

```bash
# Client only
pnpm --filter client dev

# Server only
pnpm --filter server dev
```

### Build

```bash
pnpm build
```

---

## Swapping mock.shop for a Real Shopify Store

1. In Shopify Admin → **Settings → Apps and sales channels → Develop apps**
2. Create a private app with **Storefront API** scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_write_customers`
3. Copy your **Storefront API token**
4. Update `client/.env`:

```env
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=your_storefront_token_here
```

The Apollo Client in `client/src/apollo/client.ts` automatically adds the token header when set.

### Webhook setup for real stores

In Shopify Admin → **Settings → Notifications → Webhooks**:
- Topic: `orders/created`
- URL: `https://your-server.com/webhooks/orders/created`
- Format: JSON

For HMAC verification (production), add logic to `server/src/routes/webhooks.ts` using `SHOPIFY_WEBHOOK_SECRET`.

---

## Interview Talking Points

### What this project demonstrates for a Shopify eCommerce Engineer role

**Storefront API depth**
- GraphQL Cart API (2024-01) with full mutation lifecycle: create, add lines, update quantities, remove lines
- Fragment-based query composition to avoid field repetition
- Proper `checkoutUrl` redirect flow — no deprecated Checkout API

**Headless architecture decisions**
- ApolloClient with `InMemoryCache` for client-side caching across page navigations
- Cart state persisted in `localStorage` and rehydrated on app boot via `useLazyQuery`
- Separation of concerns: context owns cart state, hooks expose it, pages consume it

**B2B/enterprise patterns**
- Webhook receiver as the trigger for downstream system integration (ServiceNow)
- Status lifecycle management (open → processing → closed) mirroring real ITSM workflows
- Polling pattern on the order confirmation page to surface async ticket creation

**TypeScript discipline**
- Full type coverage for Shopify's GraphQL response shapes
- No `any` casts — all mutations/queries have typed response interfaces
- Strict `tsconfig` throughout

**Tooling**
- pnpm workspaces monorepo managing client + server as separate packages
- `tsx` for fast TypeScript-native server dev without a build step
- Vite with proxy config so client can call server without CORS issues in development

**What I'd add in a real engagement**
- `@shopify/hydrogen` for SSR/streaming if moving to a production-grade storefront
- Shopify Functions for discount logic without server round-trips
- Redis or a database-backed ticket store instead of in-memory
- HMAC verification on the webhook receiver
- Metafields for B2B-specific product attributes (SKU, cost centre codes)
