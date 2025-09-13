const express = require('express');
const router = express.Router();
const { knex } = require('./db/db-setup');

// register FCM token for user (requires Authorization: Bearer APP_JWT)
const jwt = require('jsonwebtoken');

async function getUserFromReq(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const parts = auth.split(' ');
  if (parts.length !== 2) return null;
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
    const user = await knex('users').where({ id: decoded.uid }).first();
    return user;
  } catch (err) {
    return null;
  }
}

router.post('/register', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  try {
    // upsert token
    const existing = await knex('fcm_tokens').where({ user_id: user.id, token }).first();
    if (!existing) {
      await knex('fcm_tokens').insert({ user_id: user.id, token, created_at: knex.fn.now(), updated_at: knex.fn.now() });
    } else {
      await knex('fcm_tokens').where({ id: existing.id }).update({ updated_at: knex.fn.now() });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('register token error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
