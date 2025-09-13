
Delivery + Notifications Integration Notes
------------------------------------------

Changes made:
- Added POST /register-token  { mobile, token }  to register device token for a customer.
- When admin updates order status via POST /admin/orders/:id/status, server will try to send FCM notification to registered token.
- sendFcmNotification uses env var FCM_SERVER_KEY. If not set, server logs message and skips sending.

How to test (without real FCM):
1. Start backend: cd api_server_node && cp .env.example .env && npm install && npm start
2. Create an order via POST /orders (or use app)
3. Register a fake token for that mobile (for test purpose): 
   curl -X POST http://localhost:4000/register-token -H "Content-Type: application/json" -d '{"mobile":"9999999999","token":"fake_token_123"}'
   (This will store token in data/db.json but FCM will fail because key missing)
4. To simulate notification send without FCM key, set FCM_SERVER_KEY in .env to an empty string to see logs.
5. When admin marks order status, server will attempt to send notification (will log result).

To enable real push notifications:
- Create Firebase project, get Server key and download google-services.json for android.
- Set FCM_SERVER_KEY in .env and include google-services.json in mobile_app_expo if building native.



=== Added demo UPI & delivery endpoints ===
- Mobile app now has a 'Pay with UPI' button which opens the device's UPI intent using the UPI ID in `mobile_app_expo/src/config-expose.js`.
- API endpoints (demo):
  - POST /api/upi/mark-paid  → body: { orderId }  (marks order.paymentStatus = 'PAID' in data/db.json)
  - POST /api/order/:id/delivery → body: { status }  (updates order.deliveryStatus)

Notes:
- These are **demo** helpers. For production, integrate a payment gateway (Razorpay/Cashfree/Paytm) or server-side UPI collect APIs, and secure endpoints with auth.
- After payment via UPI intent, the app cannot automatically verify payment — bank UPI callbacks are not available here. Use a PSP or implement server-side verification.


=== Admin auth & FCM push (added) ===
- Admin protection: demo admin middleware added. Protected endpoints require header `x-admin-pin` with the ADMIN_PIN (default 1234).
  Example:
    curl -X POST http://localhost:4000/api/upi/mark-paid \
      -H "Content-Type: application/json" \
      -H "x-admin-pin: 1234" \
      -d '{"orderId":"1"}'

- FCM push demo: POST /api/notify (requires ADMIN_PIN and FCM_SERVER_KEY in your .env)
  Body:
    { "token":"<device-token>", "title":"Order updated", "body":"Your order is out for delivery", "adminPin":"1234" }
  Note: For production, generate FCM server key and device tokens from Firebase console.



=== SQLite DB + Admin Panel (added) ===
- Backend now uses SQLite file: `data/orders.sqlite` instead of db.json. More stable for production.
- Admin Panel available at `/admin/panel` (open in browser). Lists orders, lets you update status directly.
- Still requires admin pin (`x-admin-pin` header used internally by panel).
- To reset DB: delete `data/orders.sqlite` and restart server.
