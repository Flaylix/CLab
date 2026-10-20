import Stripe from 'stripe';
import { BASE_PLAN, PACKS, getOptionById } from '../config/pricing.js';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
export const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export function stripeEnabled() {
  return Boolean(stripe);
}

function lineItemsFromSelection({ packId, optionIds = [] }) {
  const items = [];
  const included = new Set();
  if (packId) {
    const pack = PACKS.find((p) => p.id === packId);
    if (pack?.stripePriceId) {
      items.push({ price: pack.stripePriceId, quantity: 1 });
      pack.optionIds.forEach((id) => included.add(id));
    }
  } else if (BASE_PLAN.stripePriceId) {
    items.push({ price: BASE_PLAN.stripePriceId, quantity: 1 });
  }
  for (const oid of optionIds) {
    if (included.has(oid)) continue;
    const opt = getOptionById(oid);
    if (opt?.stripePriceId) items.push({ price: opt.stripePriceId, quantity: 1 });
  }
  return items;
}

export async function createSubscriptionCheckout({ orderId, email, packId, optionIds, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe non configuré');
  const line_items = lineItemsFromSelection({ packId, optionIds });
  if (!line_items.length) throw new Error('Aucun prix Stripe configuré pour cette sélection');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { orderId, packId: packId || '', optionIds: JSON.stringify(optionIds || []) },
    subscription_data: {
      metadata: { orderId },
    },
    payment_method_types: ['card', 'sepa_debit'],
  });
  return session;
}

export async function addOptionToSubscription(subscriptionId, optionId) {
  if (!stripe) throw new Error('Stripe non configuré');
  const opt = getOptionById(optionId);
  if (!opt?.stripePriceId) throw new Error('Option Stripe non configurée');
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  await stripe.subscriptions.update(subscriptionId, {
    items: [...sub.items.data.map((i) => ({ id: i.id })), { price: opt.stripePriceId }],
    proration_behavior: 'create_prorations',
  });
}
