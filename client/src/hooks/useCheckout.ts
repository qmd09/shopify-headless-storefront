import { useCart } from './useCart';

export const useCheckout = () => {
  const { checkoutUrl, cart } = useCart();

  const redirectToCheckout = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return {
    redirectToCheckout,
    canCheckout: !!checkoutUrl && (cart?.totalQuantity ?? 0) > 0,
    checkoutUrl,
  };
};
