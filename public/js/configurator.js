function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function computeTotal(pricing, packId, optionIds) {
  const ids = new Set(optionIds);
  let total = pricing.base.priceMonthly;
  if (packId) {
    const pack = pricing.packs.find((p) => p.id === packId);
    if (pack) {
      total = pack.priceMonthly;
      pack.optionIds.forEach((id) => ids.delete(id));
    }
  }
  pricing.categories.forEach((cat) => {
    cat.options.forEach((o) => {
      if (ids.has(o.id)) total += o.priceMonthly;
    });
  });
  return Math.round(total * 100) / 100;
}

function suggestPack(pricing, packId, optionIds) {
  const ids = new Set(optionIds);
  let best = null;
  for (const pack of pricing.packs) {
    const includesAll = pack.optionIds.every((id) => ids.has(id));
    if (!includesAll) continue;
    const total = computeTotal(pricing, null, [...ids]);
    if (pack.priceMonthly < total && (!best || pack.priceMonthly < best.priceMonthly)) {
      best = { pack, savings: Math.round((total - pack.priceMonthly) * 100) / 100 };
    }
  }
  if (packId) return null;
  return best;
}

window.ClabPricing = { formatPrice, computeTotal, suggestPack };
