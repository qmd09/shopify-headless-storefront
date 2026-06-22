import { useQuery } from '@apollo/client';
import { GET_PRODUCT_BY_HANDLE, GET_PRODUCTS } from '../graphql';
import { ShopifyProduct } from '../types/shopify';

interface ProductsData {
  products: { edges: Array<{ node: ShopifyProduct }> };
}

interface ProductByHandleData {
  product: ShopifyProduct | null;
}

export const useProducts = (first = 20) => {
  const { data, loading, error } = useQuery<ProductsData>(GET_PRODUCTS, {
    variables: { first },
  });

  return {
    products: data?.products.edges.map((e) => e.node) ?? [],
    loading,
    error,
  };
};

export const useProductByHandle = (handle: string) => {
  const { data, loading, error } = useQuery<ProductByHandleData>(GET_PRODUCT_BY_HANDLE, {
    variables: { handle },
    skip: !handle,
  });

  return {
    product: data?.product ?? null,
    loading,
    error,
  };
};
