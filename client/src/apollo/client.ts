import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'mock.shop';
const storefrontToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

if (storefrontToken) {
  headers['X-Shopify-Storefront-Access-Token'] = storefrontToken;
}

const httpLink = createHttpLink({
  uri: `https://${storeDomain}/api/2024-01/graphql.json`,
  headers,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only', errorPolicy: 'all' },
  },
});

export default client;
