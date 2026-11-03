# Phase D1 — Pre-Flight Inspection: ShopPoint

## 1. Ports and Runtime Environment
- **Express Backend**:
  - `app.js` line 65: `const PORT = process.env.PORT || 3000;`
  - `config/config.env.example` line 2: `PORT=5000`
  - Actual default port when launched with `config/config.env` is **5000**.
  - Start script: `npm start` / `npm run start:dev` (`node app.js`).
- **React Dev Server (Client)**:
  - `client/package.json` line 3: `"proxy": "http://127.0.0.1:5000"`
  - Scripts: `"start": "react-scripts --openssl-legacy-provider start"`
  - Default port for Create React App dev server is **3000**.

## 2. Existing PayPal Integration & Intent Parameter
- **Component**: `react-paypal-button-v2` (version `^2.6.2` in `client/package.json`).
- **File**: `client/src/pages/Order.js` (lines 43–53, 241–250).
- **Script URL Loaded**:
  ```javascript
  script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
  ```
- **Intent Parameter**: **Omitted** in the existing script URL. When omitted, the PayPal JS SDK defaults to **`intent=capture`**.
- **Button Usage**:
  ```jsx
  <PayPalButton amount={order.totalPrice} onSuccess={successPaymentHandler} />
  ```
  On client approval, `successPaymentHandler` immediately dispatches `payOrder(orderId, paymentResult)` which posts browser-supplied details to the backend without prior authorization or risk verification.

## 3. Order Model & Controller Behavior
- **Model Schema (`models/Order.js`)**:
  - `orderItems`: array of subdocuments (`productName`, `qty`, `productImage`, `price`, `productId`).
  - `shipping`: `address`, `city`, `postalCode` (Number), `country`.
  - `payment`: `paymentMethod` (String).
  - Financial amounts: `itemsPrice` (Number), `taxPrice` (Number), `shippingPrice` (Number), `totalPrice` (Number).
  - Flags & timestamps: `isPaid` (Boolean, default `false`), `paidAt` (Date), `isDelivered` (Boolean, default `false`), `deliveredAt` (Date).
  - Payment details: `paymentResult`: `{ id, status, update_time, email_address }`.
  - User association: `userId` (ObjectId ref to `User`, required).
  - Timestamps: `createdAt` (Date, default `Date.now`).
- **Order Creation Controller (`controller/order.js:38-47`)**:
  - `createOrder`: Extracts payload from `req.body`, assigns `userId: req.user._id`, saves to MongoDB via `Order.create()`, returns HTTP 201 with created order document.
- **Existing Pay Endpoint (`controller/order.js:49-83`)**:
  - Route: `POST /api/v1/order/:orderId/pay`
  - Action: Unconditionally sets `order.isPaid = true` and `order.paidAt = Date.now()` using browser-provided `req.body.id` / `req.body.status` without verifying with PayPal or running risk scoring.
  - Evaluation: Per Ground Rule 6, this endpoint is **unverified and insecure**. It must be marked deprecated in comments and must NOT be reused as the payment gate.

## 4. Environment Variables Inspection
- **`config/config.env.example` Status**:
  - Contains: `PORT=5000`, `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIREIN`, `FILE_UPLOAD_PATH`, `FILE_UPLOAD_SIZE`, `CLOUD_NAME`, `API_KEY`, `API_SECRET`, `PAYPAL_CLIENT_ID`, `SEND_GRID_KEY`, `FROM_EMAIL`, `FROM_NAME`.
  - **Missing**:
    - `PAYPAL_CLIENT_SECRET` (needed for backend OAuth token retrieval)
    - `PAYPAL_ENV` (sandbox vs live)
    - `SHADOW_MODE` (control payment enforcement vs observation)
    - `RETURNGUARD_BASE_URL` (URL of ReturnGuard FastAPI service)
  - Action: Must be added to `config/config.env.example` with clear comments.

## 5. Payment Methods in Use
- String values observed in `models/Order.js` and `client/src/pages/Order.js`:
  1. `"PayPal"`
  2. `"esewa"`
- The `"esewa"` payment method path must remain completely untouched.

## 6. Server-Side PayPal HTTP Client
- **Current Status**: **None exists**.
- There is only an unauthenticated client configuration endpoint:
  ```javascript
  app.get("/api/config/paypal", (req, res) => res.send(process.env.PAYPAL_CLIENT_ID));
  ```
- **Requirement**: A server-side PayPal client (`utilis/paypal.js`) must be added in D1 to handle OAuth token acquisition, order creation with `intent=AUTHORIZE`, and order authorization without capturing funds.
