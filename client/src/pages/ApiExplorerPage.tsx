import { useState } from 'react';
import { Play, ChevronRight, Terminal, Zap, PencilLine } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

type MethodType = 'QUERY' | 'MUTATION' | 'GET' | 'POST' | 'PATCH';
type ApiType = 'graphql' | 'rest';

interface EndpointDef {
  id: string;
  name: string;
  description: string;
  apiType: ApiType;
  method: MethodType;
  codePreview: string;
  defaultBody?: string; // if set, right panel shows an editable textarea instead of a read-only block
}

interface ResponseState {
  data: unknown;
  status: number;
  timeMs: number;
  error?: string;
}

// ─── Shopify storefront helpers ───────────────────────────────────────────────

const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'mock.shop';
const storefrontToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
const SHOPIFY_URL = `https://${storeDomain}/api/2024-01/graphql.json`;
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function buildShopifyHeaders(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (storefrontToken) h['X-Shopify-Storefront-Access-Token'] = storefrontToken;
  return h;
}

async function gqlFetch(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(SHOPIFY_URL, {
    method: 'POST',
    headers: buildShopifyHeaders(),
    body: JSON.stringify({ query, variables }),
  });
  return { status: res.status, data: await res.json() };
}

// ─── GraphQL query strings ────────────────────────────────────────────────────

const GQL_GET_PRODUCTS = `query GetProducts($first: Int!) {
  products(first: $first) {
    edges {
      node {
        id
        title
        handle
        productType
        priceRange {
          minVariantPrice { amount currencyCode }
        }
      }
    }
  }
}`;

const GQL_GET_PRODUCT_BY_HANDLE = `query GetProductByHandle($handle: String!) {
  product(handle: $handle) {
    id
    title
    handle
    description
    productType
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    options { id name values }
    variants(first: 3) {
      edges {
        node {
          id
          title
          price { amount currencyCode }
          availableForSale
        }
      }
    }
  }
}`;

const GQL_CART_CREATE = `mutation CartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart {
      id
      checkoutUrl
      totalQuantity
      cost {
        totalAmount { amount currencyCode }
      }
    }
    userErrors { field message }
  }
}`;

const GQL_CART_LINES_ADD = `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart {
      id
      totalQuantity
      lines(first: 10) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price { amount currencyCode }
              }
            }
          }
        }
      }
    }
    userErrors { field message }
  }
}`;

const GQL_GET_CART = `query GetCart($cartId: ID!) {
  cart(id: $cartId) {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 10) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              price { amount currencyCode }
            }
          }
        }
      }
    }
  }
}`;

// ─── Endpoint execute functions ───────────────────────────────────────────────

async function executeGetProducts() {
  return gqlFetch(GQL_GET_PRODUCTS, { first: 4 });
}

async function executeGetProductByHandle() {
  const { data: listData } = await gqlFetch(
    `{ products(first: 1) { edges { node { handle } } } }`
  );
  const handle = listData?.data?.products?.edges?.[0]?.node?.handle ?? 'gift-card';
  return gqlFetch(GQL_GET_PRODUCT_BY_HANDLE, { handle });
}

async function executeCartCreate() {
  return gqlFetch(GQL_CART_CREATE, { input: { lines: [] } });
}

async function executeCartLinesAdd() {
  const { data: listData } = await gqlFetch(
    `{ products(first: 1) { edges { node { variants(first: 1) { edges { node { id title } } } } } } }`
  );
  const variantId = listData?.data?.products?.edges?.[0]?.node?.variants?.edges?.[0]?.node?.id;
  if (!variantId) throw new Error('No products available on this storefront');
  return gqlFetch(GQL_CART_CREATE, {
    input: { lines: [{ merchandiseId: variantId, quantity: 1 }] },
  });
}

async function executeGetCart() {
  const cartId = localStorage.getItem('shopify_cart_id');
  if (!cartId) {
    return {
      status: 200,
      data: {
        _note: 'No cart found in localStorage. Add an item via the storefront first.',
        cartId: null,
      },
    };
  }
  return gqlFetch(GQL_GET_CART, { cartId });
}

async function executeRestGet(path: string) {
  const res = await fetch(`${SERVER_URL}${path}`);
  return { status: res.status, data: await res.json() };
}

async function executeCreateTicket() {
  const res = await fetch(`${SERVER_URL}/api/servicenow/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: `EXPLORER-${Date.now()}`,
      orderNumber: `#EXP-${Math.floor(Math.random() * 9000 + 1000)}`,
      customerEmail: 'explorer@iag.co.nz',
      customerName: 'API Explorer',
      summary: 'Test ticket created from the API Explorer page.',
    }),
  });
  return { status: res.status, data: await res.json() };
}

async function executePatchTicket() {
  const listRes = await fetch(`${SERVER_URL}/api/servicenow/tickets`);
  const tickets = await listRes.json();
  if (!tickets.length) {
    return { status: 200, data: { _note: 'No tickets found. Use "Create Ticket" first.' } };
  }
  const res = await fetch(`${SERVER_URL}/api/servicenow/tickets/${tickets[0].id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return { status: res.status, data: await res.json() };
}

async function executeTestWebhook(body: string): Promise<{ status: number; data: unknown }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error('Request body is not valid JSON. Fix the syntax and try again.');
  }
  const res = await fetch(`${SERVER_URL}/webhooks/test-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed),
  });
  return { status: res.status, data: await res.json() };
}

// ─── Default body for the test webhook endpoint ───────────────────────────────

const WEBHOOK_DEFAULT_BODY = JSON.stringify(
  {
    id: 12345,
    name: '#HUB-1001',
    email: 'customer@example.com',
    billing_address: { name: 'John Smith' },
    line_items: [
      {
        title: 'Warrant of Fitness (WoF)',
        price: '99.00',
        properties: [
          { name: 'Booking Ref', value: 'BOOK-1234567890' },
          { name: 'Service Type', value: 'wof' },
          { name: 'Location', value: 'AMI MotorHub Auckland (Hobsonville)' },
          { name: 'Appointment Date', value: '2026-07-15' },
          { name: 'Appointment Time', value: '10:00 AM' },
          { name: 'Vehicle Rego', value: 'ABC123' },
          { name: 'Vehicle Make', value: 'Toyota' },
          { name: 'Vehicle Model', value: 'Corolla' },
          { name: 'Vehicle Year', value: '2019' },
        ],
      },
    ],
  },
  null,
  2
);

// ─── Endpoint catalogue ───────────────────────────────────────────────────────

const SHOPIFY_ENDPOINTS: EndpointDef[] = [
  {
    id: 'get-products',
    name: 'Get Products',
    description: 'Fetch the first 4 products — id, title, handle, productType, and price.',
    apiType: 'graphql',
    method: 'QUERY',
    codePreview: GQL_GET_PRODUCTS.replace('$first', '4'),
  },
  {
    id: 'get-product-by-handle',
    name: 'Get Product by Handle',
    description:
      'Resolves the first available product handle at runtime, then fetches full detail including options and variants.',
    apiType: 'graphql',
    method: 'QUERY',
    codePreview: GQL_GET_PRODUCT_BY_HANDLE,
  },
  {
    id: 'cart-create',
    name: 'Create Cart',
    description: 'Creates a new empty cart and returns id, checkoutUrl, and cost.',
    apiType: 'graphql',
    method: 'MUTATION',
    codePreview: GQL_CART_CREATE,
  },
  {
    id: 'cart-lines-add',
    name: 'Add to Cart',
    description:
      'Resolves a real variant ID from the catalogue, then creates a cart with that item. Demonstrates CartCreate → CartLinesAdd flow.',
    apiType: 'graphql',
    method: 'MUTATION',
    codePreview: GQL_CART_LINES_ADD,
  },
  {
    id: 'get-cart',
    name: 'Get Cart',
    description:
      'Reads cartId from localStorage (set when you add items via the storefront) and fetches the full cart.',
    apiType: 'graphql',
    method: 'QUERY',
    codePreview: GQL_GET_CART,
  },
];

const SERVICENOW_ENDPOINTS: EndpointDef[] = [
  {
    id: 'list-tickets',
    name: 'List All Tickets',
    description: 'Returns all ServiceNow job cards in reverse-creation order.',
    apiType: 'rest',
    method: 'GET',
    codePreview: `GET ${SERVER_URL}/api/servicenow/tickets`,
  },
  {
    id: 'create-ticket',
    name: 'Create Ticket',
    description: 'Manually creates a new ticket — simulates the Shopify webhook path.',
    apiType: 'rest',
    method: 'POST',
    codePreview: `POST ${SERVER_URL}/api/servicenow/tickets\n\n{\n  "orderId": "EXPLORER-<timestamp>",\n  "orderNumber": "#EXP-XXXX",\n  "customerEmail": "explorer@iag.co.nz",\n  "customerName": "API Explorer",\n  "summary": "Test ticket from API Explorer"\n}`,
  },
  {
    id: 'get-ticket',
    name: 'Get Ticket by ID',
    description:
      'Fetches a single ticket by its INC… id OR by orderId — used by the booking confirmation polling flow.',
    apiType: 'rest',
    method: 'GET',
    codePreview: `GET ${SERVER_URL}/api/servicenow/tickets/:id`,
  },
  {
    id: 'patch-ticket',
    name: 'Update Ticket Status',
    description:
      'Advances the most recent ticket through the lifecycle: open → confirmed → in-progress → quality-check → completed.',
    apiType: 'rest',
    method: 'PATCH',
    codePreview: `PATCH ${SERVER_URL}/api/servicenow/tickets/:id\n\n{} // empty body cycles status automatically`,
  },
  {
    id: 'test-webhook',
    name: 'Simulate Order Webhook',
    description:
      'POST /webhooks/test-order — simulates a Shopify orders/created webhook. Creates a ServiceNow job card from the order payload including Hub booking line item properties. Edit the JSON body before firing.',
    apiType: 'rest',
    method: 'POST',
    codePreview: `POST ${SERVER_URL}/webhooks/test-order`,
    defaultBody: WEBHOOK_DEFAULT_BODY,
  },
];

// ─── Execute dispatcher ───────────────────────────────────────────────────────

async function executeEndpoint(
  id: string,
  editableBody: string
): Promise<{ status: number; data: unknown }> {
  switch (id) {
    case 'get-products':          return executeGetProducts();
    case 'get-product-by-handle': return executeGetProductByHandle();
    case 'cart-create':           return executeCartCreate();
    case 'cart-lines-add':        return executeCartLinesAdd();
    case 'get-cart':              return executeGetCart();
    case 'list-tickets':          return executeRestGet('/api/servicenow/tickets');
    case 'create-ticket':         return executeCreateTicket();
    case 'get-ticket':            return executeRestGet('/api/servicenow/tickets');
    case 'patch-ticket':          return executePatchTicket();
    case 'test-webhook':          return executeTestWebhook(editableBody);
    default:                      throw new Error(`Unknown endpoint: ${id}`);
  }
}

// ─── JSON syntax highlighter ──────────────────────────────────────────────────

function highlightJson(data: unknown): string {
  const raw = JSON.stringify(data, null, 2);
  const safe = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return safe
    .replace(/"((?:[^"\\]|\\.)*)"(\s*:)/g, '<span class="text-purple-300 font-medium">"$1"</span>$2')
    .replace(/:\s*"((?:[^"\\]|\\.)*)"/g, ': <span class="text-green-300">"$1"</span>')
    .replace(/:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, ': <span class="text-blue-300">$1</span>')
    .replace(/:\s*(true|false|null)\b/g, ': <span class="text-orange-300">$1</span>');
}

// ─── Method badge styling ─────────────────────────────────────────────────────

const METHOD_STYLES: Record<MethodType, string> = {
  QUERY:    'bg-blue-100 text-blue-800',
  MUTATION: 'bg-purple-100 text-purple-800',
  GET:      'bg-green-100 text-green-800',
  POST:     'bg-yellow-100 text-yellow-800',
  PATCH:    'bg-orange-100 text-orange-800',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ApiExplorerPage() {
  const [selected, setSelected] = useState<EndpointDef | null>(null);
  const [editableBody, setEditableBody] = useState('');
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (ep: EndpointDef) => {
    setSelected(ep);
    setEditableBody(ep.defaultBody ?? '');
    setResponse(null);
  };

  const handleTryIt = async () => {
    if (!selected) return;
    setLoading(true);
    setResponse(null);
    const start = Date.now();
    try {
      const { status, data } = await executeEndpoint(selected.id, editableBody);
      setResponse({ data, status, timeMs: Date.now() - start });
    } catch (e) {
      setResponse({
        data: null,
        status: 0,
        timeMs: Date.now() - start,
        error: String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="h-5 w-5 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-800">API Explorer</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Browse and execute live API calls — Shopify Storefront GraphQL &amp; ServiceNow REST.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[70vh]">
        {/* ── Left panel — endpoint catalogue ─────────────────────────────── */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-5">
          {/* Shopify section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Shopify Storefront API
              </h2>
              <Badge variant="info" className="text-[10px] px-2 py-0.5">GraphQL</Badge>
            </div>
            <div className="space-y-2">
              {SHOPIFY_ENDPOINTS.map((ep) => (
                <EndpointCard
                  key={ep.id}
                  endpoint={ep}
                  isActive={selected?.id === ep.id}
                  onClick={() => handleSelect(ep)}
                />
              ))}
            </div>
          </div>

          {/* ServiceNow section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Ticketing System Integration API
              </h2>
              <Badge variant="success" className="text-[10px] px-2 py-0.5">REST</Badge>
            </div>
            <div className="space-y-2">
              {SERVICENOW_ENDPOINTS.map((ep) => (
                <EndpointCard
                  key={ep.id}
                  endpoint={ep}
                  isActive={selected?.id === ep.id}
                  onClick={() => handleSelect(ep)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel — request / response viewer ──────────────────────── */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 text-center p-8">
              <Zap className="h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-500">Select an endpoint</p>
              <p className="text-sm text-slate-400 max-w-xs">
                Choose an endpoint from the left panel to view its definition and fire a live request.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
              {/* Endpoint header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wide flex-shrink-0 ${METHOD_STYLES[selected.method]}`}
                  >
                    {selected.method}
                  </span>
                  <h3 className="font-semibold text-slate-800 truncate">{selected.name}</h3>
                  {selected.defaultBody && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">
                      <PencilLine className="h-3 w-3" /> Editable
                    </span>
                  )}
                </div>
                <Button size="sm" onClick={handleTryIt} disabled={loading} className="flex-shrink-0">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Running…
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                      Try It
                    </>
                  )}
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>

                {/* Request block — editable textarea OR read-only code block */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    {selected.apiType === 'graphql' ? 'GraphQL Document' : 'Request'}
                  </p>

                  {selected.defaultBody != null ? (
                    <>
                      <p className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
                        <PencilLine className="h-3 w-3" />
                        Edit the JSON body below before clicking Try It
                      </p>
                      <textarea
                        className="w-full bg-slate-900 text-slate-300 rounded-lg p-4 text-xs leading-relaxed font-mono resize-y min-h-[260px] outline-none focus:ring-2 focus:ring-blue-500"
                        value={editableBody}
                        onChange={(e) => setEditableBody(e.target.value)}
                        spellCheck={false}
                      />
                    </>
                  ) : (
                    <pre className="bg-slate-900 text-slate-300 rounded-lg p-4 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">
                      {selected.codePreview}
                    </pre>
                  )}
                </div>

                {/* Response block */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Response
                    </p>
                    {response && !loading && (
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            response.status >= 200 && response.status < 300
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {response.status === 0 ? 'Error' : `${response.status} OK`}
                        </span>
                        <span className="text-xs text-slate-400">{response.timeMs}ms</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 rounded-lg p-4 min-h-[120px] overflow-x-auto">
                    {loading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full bg-slate-700" />
                        <Skeleton className="h-3 w-5/6 bg-slate-700" />
                        <Skeleton className="h-3 w-4/6 bg-slate-700" />
                        <Skeleton className="h-3 w-3/4 bg-slate-700" />
                      </div>
                    ) : response ? (
                      response.error ? (
                        <pre className="text-red-400 text-xs whitespace-pre-wrap">
                          Error: {response.error}
                        </pre>
                      ) : (
                        <pre
                          className="text-xs leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: highlightJson(response.data) }}
                        />
                      )
                    ) : (
                      <p className="text-slate-600 text-xs italic">
                        Click "Try It" to fire the request and see the live response here.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EndpointCard sub-component ───────────────────────────────────────────────

function EndpointCard({
  endpoint,
  isActive,
  onClick,
}: {
  endpoint: EndpointDef;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${
        isActive
          ? 'border-blue-600 border-l-4 bg-blue-50 shadow-sm'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${METHOD_STYLES[endpoint.method]}`}
        >
          {endpoint.method}
        </span>
        <span className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
          {endpoint.name}
        </span>
        {isActive && <ChevronRight className="h-3.5 w-3.5 text-blue-600 ml-auto flex-shrink-0" />}
        {endpoint.defaultBody && !isActive && (
          <PencilLine className="h-3 w-3 text-amber-500 ml-auto flex-shrink-0" />
        )}
      </div>
      <p className="text-xs text-slate-500 leading-snug line-clamp-2">
        {endpoint.description}
      </p>
    </button>
  );
}
