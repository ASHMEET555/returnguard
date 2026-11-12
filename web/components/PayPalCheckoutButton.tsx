import React from 'react';
import styles from './PayPalCheckoutButton.module.css';

/**
 * PayPalCheckoutButton component placeholder.
 *
 * TODO (Phase D): Load PayPal SDK with NEXT_PUBLIC_PAYPAL_CLIENT_ID
 * and render official PayPal checkout buttons with createOrder / onApprove handlers.
 */
export const PayPalCheckoutButton: React.FC = () => {
  return (
    <button
      type="button"
      disabled
      className={styles.button}
      aria-label="PayPal Checkout"
    >
      <span>PayPal Checkout</span>
      <span className={styles.badgeTag}>Phase D</span>
    </button>
  );
};

export default PayPalCheckoutButton;
