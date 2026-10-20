export function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function computeSelection(pricing, { packId, optionIds }) {
  const ids = new Set(optionIds || []);
  let monthly = pricing.base.priceMonthly;
  let label = pricing.base.name;

  if (packId) {
    const pack = pricing.packs.find((p) => p.id === packId);
    if (pack) {
      monthly = pack.priceMonthly;
      label = pack.name;
      pack.optionIds.forEach((id) => ids.delete(id));
    }
  }

  for (const id of ids) {
    for (const cat of pricing.categories) {
      const opt = cat.options.find((o) => o.id === id);
      if (opt) monthly += opt.priceMonthly;
    }
  }

  monthly = Math.round(monthly * 100) / 100;

  let bestPack = null;
  for (const pack of pricing.packs) {
    const allIncluded = [...pack.optionIds].every((id) => ids.has(id) || packId === pack.id);
    const selectedMatch =
      packId === pack.id ||
      (!packId && pack.optionIds.length && pack.optionIds.every((id) => ids.has(id)));
    if (selectedMatch && pack.priceMonthly < monthly) {
      bestPack = pack;
    }
  }

  return { monthly, label, leftoverOptionIds: [...ids], suggestedPack: bestPack };
}
