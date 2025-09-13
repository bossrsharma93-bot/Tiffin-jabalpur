const express = require('express');
const router = express.Router();
const admin = require('./firebase-admin');
const { knex } = require('./db/db-setup');

// Verify Firebase ID token and upsert user into DB, then return app JWT (simple)
const jwt = require('jsonwebtoken');

router.post('/fbtoken', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'idToken required' });
  if (!admin) return res.status(500).json({ error: 'Firebase admin not configured' });
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const phone = decoded.phone_number || decoded.phone;
    if (!phone) return res.status(400).json({ error: 'phone_number not present in token' });

    // upsert user
    const existing = await knex('users').where({ phone }).first();
    let user;
    if (existing) {
      await knex('users').where({ id: existing.id }).update({ is_verified: true, updated_at: knex.fn.now() });
      user = await knex('users').where({ id: existing.id }).first();
    } else {
      const [id] = await knex('users').insert({ phone, is_verified: true, created_at: knex.fn.now(), updated_at: knex.fn.now() }).returning('id');
      user = await knex('users').where({ id }).first();
    }

    // sign app JWT
    const token = jwt.sign({ uid: user.id, phone: user.phone }, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: '30d' });
    res.json({ success: true, token, user });
  } catch (err) {
    console.error('fbtoken error', err);
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;
