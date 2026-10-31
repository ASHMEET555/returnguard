import React from 'react';

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
      style={{
        padding: '10px 20px',
        backgroundColor: '#ffc439',
        border: '1px solid #e0aa2b',
        borderRadius: '4px',
        cursor: 'not-allowed',
        fontWeight: 'bold',
      }}
    >
      PayPal Checkout (Phase D Scaffolding)
    </button>
  );
};

export default PayPalCheckoutButton;
