import { stripe } from './stripe-service.js';
import { updateOrder } from './orders.js';
import { upsertClientFromOrder, getClientByEmail, updateClient, listClients } from './clients.js';
import { notifyOwnerNewOrder, emailClientOrderConfirmation, emailClientPaymentFailed } from './brevo-mail.js';

export async function handleStripeWebhook(req, res) {
  if (!stripe) return res.status(503).send('Stripe off');
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = secret
      ? stripe.webhooks.constructEvent(req.body, sig, secret)
      : JSON.parse(req.body.toString());
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const order = updateOrder(orderId, {
          status: 'paye',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        });
        if (order) {
          upsertClientFromOrder({ ...order, status: 'paye' });
          await notifyOwnerNewOrder(order);
          await emailClientOrderConfirmation(order);
        }
      }
    }
    if (event.type === 'invoice.paid') {
      const inv = event.data.object;
      const email = inv.customer_email;
      const client = email ? getClientByEmail(email) : null;
      if (client && client.status === 'impaye') {
        updateClient(client.id, { status: 'actif' });
      }
    }
    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const client = listClients().find((c) => c.stripeSubscriptionId === sub.id);
      if (client && sub.status === 'active' && client.status === 'impaye') {
        updateClient(client.id, { status: 'actif' });
      }
    }
    if (event.type === 'invoice.payment_failed') {
      const inv = event.data.object;
      const email = inv.customer_email;
      if (email) await emailClientPaymentFailed(email);
      const client = getClientByEmail(email);
      if (client) updateClient(client.id, { status: 'impaye' });
    }
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      listClients()
        .filter((c) => c.stripeSubscriptionId === sub.id)
        .forEach((c) => updateClient(c.id, { status: 'resilie' }));
    }
  } catch (e) {
    console.error('Webhook handler:', e);
  }
  res.json({ received: true });
}
