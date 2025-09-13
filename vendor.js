const express = require('express');
const router = express.Router();
const { knex } = require('./db/db-setup');
const bcrypt = require('bcrypt');

// Vendor signup (basic, no KYC files here)
router.post('/signup', async (req, res) => {
  const { name, email, password, address } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'missing fields' });
  try {
    const vendorId = await knex('vendors').insert({ name, address, created_at: knex.fn.now(), updated_at: knex.fn.now() }).returning('id');
    const vId = Array.isArray(vendorId)?vendorId[0]:vendorId;
    const password_hash = await bcrypt.hash(password, 10);
    await knex('vendor_admins').insert({ vendor_id: vId, email, password_hash, created_at: knex.fn.now(), updated_at: knex.fn.now() });
    res.json({ success: true, vendor_id: vId });
  } catch (err) {
    console.error('vendor signup', err);
    res.status(500).json({ error: err.message });
  }
});

// Vendor login (returns simple token stub) - in production replace with JWT + sessions
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'missing fields' });
  try {
    const admin = await knex('vendor_admins').where({ email }).first();
    if (!admin) return res.status(401).json({ error: 'invalid' });
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid' });
    // simple token (DO NOT use in production) - return admin id
    res.json({ success: true, admin: { id: admin.id, vendor_id: admin.vendor_id } });
  } catch (err) {
    console.error('vendor login', err);
    res.status(500).json({ error: err.message });
  }
});

// Items CRUD - this repo's demo uses items in vendor flow stored in vendors.items in future; here just stub
router.get('/:vendorId/items', async (req, res) => {
  const vendorId = req.params.vendorId;
  // TODO: implement items table; for now return sample menu
  res.json({ items: [
    { id: 'm1', name: 'Veg Thali', price: 99 },
    { id: 'm2', name: 'Paneer Butter Masala', price: 149 }
  ] });
});

// vendor orders list
router.get('/:vendorId/orders', async (req, res) => {
  const vendorId = req.params.vendorId;
  try {
    const orders = await knex('orders').where({ vendor_id: vendorId }).orderBy('created_at', 'desc').limit(100);
    res.json({ orders });
  } catch (err) {
    console.error('vendor orders', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
