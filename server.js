
import 'dotenv/config';
import express from 'express';
import cors from 'cors';


// Load shared config
import fs from 'fs';
const sharedConfig = JSON.parse(fs.readFileSync('../sharma-config.json','utf-8'));
db.data.menu = { pricing: sharedConfig.pricing };
db.data.config = { delivery: sharedConfig.delivery, upiId: process.env.UPI_ID || sharedConfig.upiId, businessName: process.env.BUSINESS_NAME || sharedConfig.businessName };

// Helpers
const priceForType = (type) => {
  const p = db.data.menu.pricing;
  switch(type){
    case 'daily': return p.dailyMeal;
    case 'breakfast': return p.breakfast;
    case 'monthlyVeg': return p.monthlyVeg;
    case 'monthlyNonVeg': return p.monthlyNonVeg;
    default: return 0;
  }
};

const deliveryFeeForKm = (km) => {
  const slabs = db.data.config.delivery.slabs;
  for(const s of slabs){
    if(km <= s.maxKm) return s.fee;
  }
  return slabs[slabs.length-1].fee;
};

const upiUrl = ({payeeVpa, payeeName, amount, note}) => {
  // UPI deep link
  const params = new URLSearchParams({
    pa: payeeVpa,
    pn: payeeName || 'Sharma Tiffin',
    am: String(amount),
    cu: 'INR',
    tn: note || 'Tiffin order'
  });
  return `upi://pay?${params.toString()}`;
};

// Routes
app.get('/', (req,res)=> res.json({ ok:true, name: db.data.config.businessName }));

app.get('/menu', async (req,res)=>{
  res.json(db.data.menu);
});

app.get('/delivery/fee', async (req,res)=>{
  const km = Math.max(0, parseFloat(req.query.km||'0'));
  const fee = deliveryFeeForKm(km);
  res.json({ km, fee });
});

app.post('/orders', async (req,res)=>{
  const { mobile, type, qty=1, distanceKm=0, note='' } = req.body;
  const unitPrice = priceForType(type);
  const deliveryFee = deliveryFeeForKm(distanceKm);
  const amount = unitPrice * qty + deliveryFee;
  const id = nanoid(8);
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO orders (id, createdAt, mobile, type, qty, distanceKm, note, unitPrice, deliveryFee, amount, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id, createdAt, mobile, type, qty, distanceKm, note, unitPrice, deliveryFee, amount, 'pending_payment');
  const payUrl = upiUrl({ payeeVpa: process.env.UPI_ID, payeeName: process.env.BUSINESS_NAME, amount, note: `Order ${id}` });
  res.json({ ok:true, order:{ id, createdAt, mobile, type, qty, distanceKm, note, unitPrice, deliveryFee, amount, status:'pending_payment' }, payment:{ upiUrl: payUrl, amount } });
});
  const { mobile, type, qty=1, distanceKm=0, note='' } = req.body;
  const unitPrice = priceForType(type);
  const deliveryFee = deliveryFeeForKm(distanceKm);
  const amount = unitPrice * qty + deliveryFee;
  const order = {
    id: nanoid(8),
    createdAt: new Date().toISOString(),
    mobile, type, qty, distanceKm, note,
    unitPrice, deliveryFee, amount,
    status: 'pending_payment'
  };
  db.data.orders.unshift(order);
  await db.write();

  const payUrl = upiUrl({ payeeVpa: db.data.config.upiId, payeeName: db.data.config.businessName, amount, note: `Order ${order.id}` });
  res.json({ ok:true, order, payment: { upiUrl: payUrl, amount } });
});

// Admin
app.post('/admin/login', (req,res)=>{
  const ok = (req.body.pin || '') === (process.env.ADMIN_PIN || '1234');
  res.json({ ok });
});

app.get('/admin/orders', async (req,res)=>{
  const rows = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
  res.json(rows);
});
  res.json(db.data.orders);
});

app.post('/admin/orders/:id/status', async (req,res)=>{
  const id = req.params.id;
  const { status } = req.body;
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
  if (!o) return res.status(404).json({ ok:false, error:'not_found' });
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, id);
  // TODO: notify via FCM if token registered
  res.json({ ok:true });
});
  const id = req.params.id;
  const { status } = req.body;
  const o = db.data.orders.find(x=>x.id===id);
  if(!o) return res.status(404).json({ ok:false, error:'not_found' });
  o.status = status;
  // send notification to customer (if token registered)
  try{
    const custMobile = o.mobile;
    const token = db.data.tokens && db.data.tokens[custMobile];
    if(token){
      const title = `Order ${o.id} - ${o.status}`;
      const body = `Your order status changed to ${o.status}`;
      await sendFcmNotification(token, title, body, { orderId: o.id, status: o.status });
    } else {
      console.log('[notify] no token for mobile', custMobile);
    }
  }catch(e){
    console.error('[notify] failed to send notification', e);
  }

  await db.write();
  res.json({ ok:true });
});



/**
 * PAYMENT: Create Razorpay Payment Link
 * - Requires env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
 * - Creates a payment link for a given order payload and returns { ok, url }
 * - If credentials are missing, returns helpful error so dev can follow README.
 */
import fetch from 'node-fetch'; // lightweight fetch for creating payment links

app.post('/payments/create_link', async (req, res) => {
  const { amount, customer, description } = req.body || {};
  if (!amount || !customer || !customer.name || !customer.phone) {
    return res.status(400).json({ ok:false, error: 'missing_parameters', message: 'Provide amount and customer {name, phone}' });
  }
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) {
    return res.status(500).json({ ok:false, error:'no_credentials', message: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env' });
  }

  try {
    const body = {
      amount: Number(amount) * 100, // INR paise
      currency: 'INR',
      accept_partial: false,
      reference_id: `order_${Date.now()}`,
      description: description || 'Sharma Tiffin Order',
      customer: {
        name: customer.name,
        contact: customer.phone,
        email: customer.email || ''
      },
      notify: { sms: true, email: true },
      callback_url: `${req.protocol}://${req.get('host')}/payments/webhook`,
      callback_method: 'get'
    };

    const resp = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64')
      },
      body: JSON.stringify(body)
    });
    const j = await resp.json();
    if (resp.status >= 400) {
      return res.status(resp.status).json({ ok:false, error:'razorpay_error', detail: j });
    }
    return res.json({ ok:true, url: j.short_url, raw: j });
  } catch (e) {
    console.error('create_link_err', e);
    return res.status(500).json({ ok:false, error:'server_error', message: e.message });
  }
});

/**
 * Simple Admin UI (static) - lists orders and allows status update (calls existing admin endpoint)
 */
app.get('/admin', async (req, res) => {
  await db.read();
  const html = `
  <!doctype html><html><head><meta charset="utf-8"><title>Sharma Tiffin Admin</title>
  <style>body{font-family:Arial;margin:20px} table{border-collapse:collapse;width:100%} td,th{border:1px solid #ddd;padding:8px} th{background:#f4f4f4}</style>
  </head><body>
  <h2>Admin - Orders</h2>
  <table><thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Items</th><th>Status</th><th>Action</th></tr></thead><tbody>
  ${db.data.orders.map(o=>`<tr><td>${o.id}</td><td>${o.customer?.name||''}</td><td>${o.customer?.phone||''}</td><td>${(o.items||[]).map(i=>i.title).join(', ')}</td><td>${o.status||''}</td><td><button onclick="update('${o.id}','preparing')">Preparing</button> <button onclick="update('${o.id}','out_for_delivery')">Out for delivery</button> <button onclick="update('${o.id}','delivered')">Delivered</button></td></tr>`).join('')}
  </tbody></table>
  <script>
    async function update(id,status){
      const pin = prompt('Enter admin pin');
      if(!pin) return;
      const res = await fetch('/admin/orders/'+id+'/status', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status, pin})});
      const j = await res.json();
      alert(JSON.stringify(j));
      if(j.ok) location.reload();
    }
  </script>
  </body></html>
  `;
  res.set('Content-Type','text/html').send(html);
});



// --- Simple Admin Panel Web UI ---
app.get('/admin/panel', (req,res)=>{
  const rows = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Admin Panel</title>
  <style>body{font-family:Arial} table{border-collapse:collapse;width:100%} td,th{border:1px solid #ccc;padding:6px} th{background:#f0f0f0}</style>
  </head><body>
  <h2>Orders</h2>
  <table><thead><tr><th>ID</th><th>Mobile</th><th>Type</th><th>Qty</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
  <tbody>
  ${rows.map(o=>`<tr><td>${o.id}</td><td>${o.mobile}</td><td>${o.type}</td><td>${o.qty}</td><td>${o.amount}</td><td>${o.status}</td>
  <td><form method="POST" action="/admin/orders/${o.id}/status" onsubmit="return submitForm(event,this)">
    <select name="status">
      <option value="pending_payment">Pending</option>
      <option value="paid">Paid</option>
      <option value="preparing">Preparing</option>
      <option value="out_for_delivery">Out for Delivery</option>
      <option value="delivered">Delivered</option>
    </select>
    <input type="submit" value="Update"/>
  </form></td></tr>`).join('')}
  </tbody></table>
  <script>
    async function submitForm(ev,form){
      ev.preventDefault();
      const data = {status: form.status.value};
      const res = await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json','x-admin-pin':'${process.env.ADMIN_PIN||'1234'}'},body:JSON.stringify(data)});
      const j = await res.json();
      alert(JSON.stringify(j));
      if(j.ok) location.reload();
    }
  </script>
  </body></html>`;
  res.set('Content-Type','text/html').send(html);
});

// Health & readiness
app.get('/health', (req,res)=>res.json({ ok:true, status:'up' }));

// Razorpay Payment Link callback (GET) and Webhook (POST)
// Note: For Payment Links callback, Razorpay sends query params including razorpay_payment_id, razorpay_payment_link_id, razorpay_signature
app.get('/payments/webhook', async (req,res)=>{
  const { razorpay_payment_id, razorpay_payment_link_id, razorpay_order_id, razorpay_signature, orderId } = req.query;
  try{
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if(!secret) return res.status(500).send('Missing RAZORPAY_KEY_SECRET');

    // Build possible payloads based on what was used: order or payment link
    const possible = [];
    if(razorpay_payment_link_id && razorpay_payment_id){
      possible.push(`${razorpay_payment_link_id}|${razorpay_payment_id}`);
    }
    if(razorpay_order_id && razorpay_payment_id){
      possible.push(`${razorpay_order_id}|${razorpay_payment_id}`);
    }

    let verified = false;
    for(const base of possible){
      const h = crypto.createHmac('sha256', secret).update(base).digest('hex');
      if(h === razorpay_signature){ verified = true; break; }
    }
    if(!verified){
      return res.status(400).send('Signature verification failed');
    }

    // Mark order as paid if present
    await db.read();
    if(orderId){
      const o = db.data.orders.find(x=>x.id===orderId);
      if(o){ o.status = 'paid'; o.payment = { razorpay_payment_id, verified:true, at: new Date().toISOString() }; await db.write(); }
    }
    return res.send('OK');
  }catch(e){
    console.error('webhook_err', e);
    return res.status(500).send('Server error');
  }
});

// Raw webhook for events (configure Razorpay dashboard). Provide header x-razorpay-signature
app.post('/payments/razorpay-webhook', express.raw({type:'application/json'}), async (req,res)=>{
  try{
    const signature = req.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if(!secret) return res.status(500).send('Missing webhook secret');
    const payload = req.body; // Buffer due to raw()
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if(expected !== signature){ return res.status(400).send('Bad signature'); }

    // naive handler: if event contains an order/notes.orderId mark paid
    const data = JSON.parse(payload.toString('utf-8'));
    const notesOrderId = data?.payload?.payment?.entity?.notes?.orderId;
    if(notesOrderId){
      await db.read();
      const o = db.data.orders.find(x=>x.id===notesOrderId);
      if(o){ o.status='paid'; o.payment={ event:data.event, verified:true, at:new Date().toISOString() }; await db.write(); }
    }
    res.send('OK');
  }catch(e){
    console.error('rp_webhook_err', e);
    res.status(500).send('Server error');
  }
});


// --- UPI / Delivery helper endpoints (minimal, for demo) ---

// --- Simple admin middleware (use x-admin-pin header) ---
function requireAdmin(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.body && req.body.adminPin;
  if (!pin || String(pin) !== String(ADMIN_PIN)) {
    return res.status(401).json({ error: 'admin auth failed' });
  }
  return next();
}
// --- FCM push notification demo endpoint ---
// POST /api/notify
// body: { token: "<fcm-device-token>", title: "...", body: "...", adminPin: "1234" }
app.post('/api/notify', express.json(), requireAdmin, async (req, res) => {
  const { token, title, body } = req.body || {};
  if (!token || !title || !body) return res.status(400).json({ error: 'token, title, body required' });
  if (!FCM_SERVER_KEY) return res.status(500).json({ error: 'FCM_SERVER_KEY not configured in env' });

  try {
    // use fetch to call FCM (node 18+ has fetch)
    const resp = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': 'key=' + FCM_SERVER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body }
      })
    });
    const data = await resp.json();
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

// ---------------------------

app.post('/api/upi/mark-paid', express.json(), requireAdmin, (req, res) => {
  // body: { orderId }
  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'orderId required' });
  const dbPath = path.join(__dirname, 'data', 'db.json');
  const db = JSON.parse(fs.readFileSync(dbPath));
  const order = db.orders && db.orders.find(o => String(o.id) === String(orderId));
  if (!order) return res.status(404).json({ error: 'order not found' });
  order.paymentStatus = 'PAID';
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  return res.json({ ok: true, order });
});

app.post('/api/order/:id/delivery', express.json(), requireAdmin, (req, res) => {
  // body: { status }
  const status = req.body && req.body.status;
  const id = req.params.id;
  if (!status) return res.status(400).json({ error: 'status required' });
  const dbPath = path.join(__dirname, 'data', 'db.json');
  const db = JSON.parse(fs.readFileSync(dbPath));
  const order = db.orders && db.orders.find(o => String(o.id) === String(id));
  if (!order) return res.status(404).json({ error: 'order not found' });
  order.deliveryStatus = status;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  return res.json({ ok: true, order });
});
// --- FCM push notification demo endpoint ---
// POST /api/notify
// body: { token: "<fcm-device-token>", title: "...", body: "...", adminPin: "1234" }
app.post('/api/notify', express.json(), requireAdmin, async (req, res) => {
  const { token, title, body } = req.body || {};
  if (!token || !title || !body) return res.status(400).json({ error: 'token, title, body required' });
  if (!FCM_SERVER_KEY) return res.status(500).json({ error: 'FCM_SERVER_KEY not configured in env' });

  try {
    // use fetch to call FCM (node 18+ has fetch)
    const resp = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': 'key=' + FCM_SERVER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body }
      })
    });
    const data = await resp.json();
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

// ---------------------------

app.listen(process.env.PORT || 4000, ()=>{
  console.log('API listening on', process.env.PORT || 4000);
});


// --- marketplace integrations auto-insert (payments & firebase) ---
const paymentsRouter = require('./payments');
const firebaseAdmin = require('./firebase-admin');

// mount payments router
app.use('/payments', paymentsRouter);

// simple healthcheck endpoint
app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));
// ---------------------------------------------------------------


// --- marketplace endpoints mount (auth, tokens, payments) ---
const authRouter = require('./auth');
const tokensRouter = require('./tokens');
const paymentsRouter = require('./payments');

app.use('/auth', authRouter);
app.use('/tokens', tokensRouter);
// Important: payments webhook expects raw body; ensure payments router mounted before generic JSON parser if using raw route
app.use('/payments', paymentsRouter);
// --- end mount ---


// vendor routes mount
const vendorRouter = require('./vendor');
app.use('/vendor', vendorRouter);
