import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import {
  CART_CREATE,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
  GET_CART,
} from '../graphql';
import { ShopifyCart } from '../types/shopify';

interface CartContextValue {
  cart: ShopifyCart | null;
  cartCount: number;
  checkoutUrl: string | null;
  loading: boolean;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue>({} as CartContextValue);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartId, setCartId] = useState<string | null>(
    () => localStorage.getItem('shopify_cart_id')
  );
  const [cart, setCart] = useState<ShopifyCart | null>(null);

  const [fetchCart, { loading: cartLoading }] = useLazyQuery<{ cart: ShopifyCart }>(GET_CART, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.cart) setCart(data.cart);
    },
    onError: () => {
      // Cart may have expired — clear stale id
      localStorage.removeItem('shopify_cart_id');
      setCartId(null);
    },
  });

  const [createCart] = useMutation<{ cartCreate: { cart: ShopifyCart } }>(CART_CREATE);
  const [addLines] = useMutation<{ cartLinesAdd: { cart: ShopifyCart } }>(CART_LINES_ADD);
  const [updateLines] = useMutation<{ cartLinesUpdate: { cart: ShopifyCart } }>(CART_LINES_UPDATE);
  const [removeLines] = useMutation<{ cartLinesRemove: { cart: ShopifyCart } }>(CART_LINES_REMOVE);

  useEffect(() => {
    if (cartId) {
      fetchCart({ variables: { cartId } });
    }
  }, [cartId, fetchCart]);

  const addToCart = useCallback(
    async (variantId: string, quantity: number) => {
      if (!cartId) {
        const { data } = await createCart({
          variables: {
            input: { lines: [{ merchandiseId: variantId, quantity }] },
          },
        });
        const newCart = data?.cartCreate?.cart;
        if (newCart) {
          localStorage.setItem('shopify_cart_id', newCart.id);
          setCartId(newCart.id);
          setCart(newCart);
        }
      } else {
        const { data } = await addLines({
          variables: {
            cartId,
            lines: [{ merchandiseId: variantId, quantity }],
          },
        });
        const updated = data?.cartLinesAdd?.cart;
        if (updated) setCart(updated);
      }
    },
    [cartId, createCart, addLines]
  );

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cartId) return;
      if (quantity < 1) return;
      const { data } = await updateLines({
        variables: { cartId, lines: [{ id: lineId, quantity }] },
      });
      const updated = data?.cartLinesUpdate?.cart;
      if (updated) setCart(updated);
    },
    [cartId, updateLines]
  );

  const removeFromCart = useCallback(
    async (lineId: string) => {
      if (!cartId) return;
      const { data } = await removeLines({
        variables: { cartId, lineIds: [lineId] },
      });
      const updated = data?.cartLinesRemove?.cart;
      if (updated) setCart(updated);
    },
    [cartId, removeLines]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount: cart?.totalQuantity ?? 0,
        checkoutUrl: cart?.checkoutUrl ?? null,
        loading: cartLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used within CartProvider');
  return ctx;
};
