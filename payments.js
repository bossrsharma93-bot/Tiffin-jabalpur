// Extended webhook reconciliation: update payments & orders and send FCM via firebase-admin
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const router = express.Router();
const { knex } = require('./db/db-setup');
const admin = require('./firebase-admin');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.post('/create_link', bodyParser.json(), async (req, res) => {
  const { amount, customer, orderId } = req.body;
  try {
    const link = await razorpay.paymentLink.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      accept_partial: false,
      description: `Order ${orderId}`,
      customer: {
        name: customer?.name || 'Customer',
        contact: customer?.phone,
        email: customer?.email
      },
      notify: {sms: true, email: true},
      reminder_enable: true,
      notes: { orderId: String(orderId) },
      callback_url: `${process.env.APP_BASE_URL || 'http://localhost:4000'}/payments/razorpay_callback`,
      callback_method: "get"
    });
    // store initial payment record
    if (orderId) {
      await knex('payments').insert({
        order_id: orderId,
        amount: amount,
        provider: 'razorpay',
        status: 'created',
        meta: JSON.stringify(link),
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }
    res.json({ success: true, link: link.short_url, raw: link });
  } catch (err) {
    console.error('create_link error', err);
    res.status(500).json({ error: err.message });
  }
});

// Webhook: use raw body parser at mount time in server.js when wiring this file
router.post('/razorpay-webhook', bodyParser.raw({ type: '*/*' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '').update(req.body).digest('hex');
    if (signature !== expected) {
      console.warn('Invalid webhook signature');
      return res.status(400).send('invalid signature');
    }
    const payload = JSON.parse(req.body.toString());
    console.log('razorpay webhook payload', payload.event);

    // Handle payment_link.paid event
    if (payload.event === 'payment_link.paid') {
      const paymentEntity = payload.payload.payment.entity;
      const notes = payload.payload.payment_link?.entity?.notes || {};
      const orderId = notes.orderId || (paymentEntity.notes && paymentEntity.notes.orderId);
      const providerPaymentId = paymentEntity.id || paymentEntity.payment_id || null;
      const amount = (paymentEntity.amount || paymentEntity.amount_paid || 0) / 100;

      // update payments table and order status
      if (orderId) {
        // update payment record if exists else insert
        const existing = await knex('payments').where({ provider_payment_id: providerPaymentId }).first();
        if (!existing) {
          await knex('payments').insert({
            order_id: orderId,
            amount: amount,
            provider: 'razorpay',
            provider_payment_id: providerPaymentId,
            status: 'captured',
            meta: JSON.stringify(paymentEntity),
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
          });
        } else {
          await knex('payments').where({ id: existing.id }).update({ status: 'captured', updated_at: knex.fn.now() });
        }

        // update order status to 'paid'
        await knex('orders').where({ id: orderId }).update({ status: 'paid', payment_provider: 'razorpay', payment_id: providerPaymentId, updated_at: knex.fn.now() });

        // fetch user fcm tokens and send notification
        try {
          const order = await knex('orders').where({ id: orderId }).first();
          if (order) {
            const userId = order.user_id;
            const tokens = await knex('fcm_tokens').where({ user_id: userId }).select('token');
            const tokenList = tokens.map(t => t.token).filter(Boolean);
            if (tokenList.length && admin) {
              const message = {
                notification: { title: 'Payment received', body: `Order ${orderId} marked as paid.` },
                tokens: tokenList
              };
              const resp = await admin.messaging().sendMulticast(message);
              console.log('FCM send result', resp.successCount, 'successes');
            }
          }
        } catch (err) {
          console.error('fcm send error', err);
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('webhook error', err);
    res.status(500).send('error');
  }
});

module.exports = router;
