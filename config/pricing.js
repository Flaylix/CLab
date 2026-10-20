/** Source unique des prix CLab — modifier ici uniquement */

export const LEGAL = {
  vatFranchise: true,
  vatNote: 'TVA non applicable, art. 293 B du CGI',
  currency: 'EUR',
  priceSuffix: 'HT/mois',
  setupFee: 0,
  baseCommitmentMonths: 12,
  optionCommitmentMonths: 3,
  noticeMonths: 1,
  deliveryHours: 72,
};

export const CONTACT = {
  phone: '0637160713',
  phoneTel: '+33637160713',
  email: 'contact@clab.fr',
  site: 'https://clab.it.com',
};

export const BASE_PLAN = {
  id: 'essentiel',
  slug: 'essentiel',
  name: 'CLab Essentiel',
  priceMonthly: 34.9,
  stripePriceId: process.env.STRIPE_PRICE_ESSENTIEL || '',
  tagline: 'Votre site pro clé en main',
  includes: [
    'Site vitrine sur mesure jusqu’à 5 pages, responsive mobile',
    'Nom de domaine (.fr ou .com) inclus tant que l’abonnement est actif',
    'Hébergement, certificat SSL, sauvegardes',
    'Maintenance, sécurité et mises à jour',
    'Formulaires (contact, devis, réservation) avec e-mails automatiques',
    'Notification instantanée au professionnel + accusé de réception au client',
    'Bouton d’appel et lien WhatsApp',
    'Fiche Google Business, carte Google Maps et horaires',
    'Référencement de base (SEO, sitemap, Search Console)',
    '1 petite modification par mois',
    'Support e-mail et téléphone',
  ],
};

export const OPTION_CATEGORIES = [
  {
    id: 'visibilite',
    label: 'Visibilité & publicité',
    options: [
      {
        id: 'google-ads',
        slug: 'gestion-google-ads',
        name: 'Gestion publicité Google Ads',
        priceMonthly: 49,
        stripePriceId: process.env.STRIPE_PRICE_GOOGLE_ADS || '',
        note: 'Budget publicitaire payé directement par vous à Google (non inclus).',
        seoTitle: 'Gestion Google Ads pour artisans et commerçants',
      },
      {
        id: 'meta-ads',
        slug: 'gestion-meta-ads',
        name: 'Gestion publicité Facebook / Instagram',
        priceMonthly: 49,
        stripePriceId: process.env.STRIPE_PRICE_META_ADS || '',
        note: 'Budget publicitaire non inclus.',
      },
      {
        id: 'google-business',
        slug: 'gestion-fiche-google',
        name: 'Gestion fiche Google Business',
        priceMonthly: 14.9,
        stripePriceId: process.env.STRIPE_PRICE_GOOGLE_BUSINESS || '',
        note: 'Publications, photos, réponses aux avis.',
      },
      {
        id: 'pack-avis',
        slug: 'pack-avis-google',
        name: 'Pack avis Google',
        priceMonthly: 9.9,
        stripePriceId: process.env.STRIPE_PRICE_PACK_AVIS || '',
        note: 'QR code + carte NFC « Laissez-nous un avis » + suivi.',
      },
      {
        id: 'seo-local',
        slug: 'referencement-local',
        name: 'Référencement local avancé',
        priceMonthly: 24.9,
        stripePriceId: process.env.STRIPE_PRICE_SEO_LOCAL || '',
        note: 'Pages par ville + 1 article de blog / mois.',
      },
      {
        id: 'rapport-stats',
        slug: 'rapport-statistiques',
        name: 'Rapport mensuel de statistiques',
        priceMonthly: 4.9,
        stripePriceId: process.env.STRIPE_PRICE_RAPPORT || '',
        note: 'Visites, appels, demandes.',
      },
    ],
  },
  {
    id: 'fonctionnalites',
    label: 'Fonctionnalités',
    options: [
      {
        id: 'reservation',
        slug: 'reservation-en-ligne',
        name: 'Agenda de réservation en ligne',
        priceMonthly: 14.9,
        stripePriceId: process.env.STRIPE_PRICE_RESERVATION || '',
        note: 'Créneaux, confirmation, annulation.',
      },
      {
        id: 'sms-rappel',
        slug: 'rappels-sms',
        name: 'Rappels de rendez-vous par SMS',
        priceMonthly: 9.9,
        stripePriceId: process.env.STRIPE_PRICE_SMS_RAPPEL || '',
      },
      {
        id: 'click-collect',
        slug: 'click-and-collect',
        name: 'Click & collect / commande en ligne',
        priceMonthly: 19.9,
        stripePriceId: process.env.STRIPE_PRICE_CLICK_COLLECT || '',
      },
      {
        id: 'ecommerce',
        slug: 'boutique-ecommerce',
        name: 'Boutique e-commerce (jusqu’à 50 produits)',
        priceMonthly: 29.9,
        stripePriceId: process.env.STRIPE_PRICE_ECOMMERCE || '',
      },
      {
        id: 'simulateur',
        slug: 'simulateur-devis',
        name: 'Simulateur de prix / devis en ligne',
        priceMonthly: 9.9,
        stripePriceId: process.env.STRIPE_PRICE_SIMULATEUR || '',
      },
      {
        id: 'chatbot',
        slug: 'chatbot-ia',
        name: 'Chatbot IA 24h/24',
        priceMonthly: 14.9,
        stripePriceId: process.env.STRIPE_PRICE_CHATBOT || '',
      },
      {
        id: 'multilingue',
        slug: 'site-multilingue',
        name: 'Site multilingue (par langue)',
        priceMonthly: 9.9,
        stripePriceId: process.env.STRIPE_PRICE_MULTILINGUE || '',
      },
      {
        id: 'pages-extra',
        slug: 'pages-supplementaires',
        name: 'Pages supplémentaires (lot de 5)',
        priceMonthly: 4.9,
        stripePriceId: process.env.STRIPE_PRICE_PAGES || '',
      },
    ],
  },
  {
    id: 'confort',
    label: 'Confort',
    options: [
      {
        id: 'email-pro',
        slug: 'email-professionnel',
        name: 'Adresse e-mail professionnelle',
        priceMonthly: 2.9,
        stripePriceId: process.env.STRIPE_PRICE_EMAIL || '',
        note: 'Par adresse (ex. contact@votredomaine.fr).',
      },
      {
        id: 'modifs-illimitees',
        slug: 'modifications-illimitees',
        name: 'Modifications illimitées + priorité 24 h',
        priceMonthly: 14.9,
        stripePriceId: process.env.STRIPE_PRICE_MODIFS || '',
      },
      {
        id: 'logo-charte',
        slug: 'logo-charte',
        name: 'Logo & charte graphique',
        priceMonthly: 5,
        stripePriceId: process.env.STRIPE_PRICE_LOGO || '',
        commitmentMonths: 12,
      },
    ],
  },
];

export const PACKS = [
  {
    id: 'visibilite',
    slug: 'pack-visibilite',
    name: 'Pack Visibilité',
    priceMonthly: 54.9,
    stripePriceId: process.env.STRIPE_PRICE_PACK_VISIBILITE || '',
    badge: null,
    optionIds: ['google-business', 'pack-avis', 'rapport-stats'],
    description: 'Essentiel + fiche Google + avis + rapport mensuel.',
  },
  {
    id: 'artisan-pro',
    slug: 'pack-artisan-pro',
    name: 'Pack Artisan Pro',
    priceMonthly: 79.9,
    stripePriceId: process.env.STRIPE_PRICE_PACK_ARTISAN || '',
    badge: 'Le plus choisi',
    replacesPackId: 'visibilite',
    optionIds: ['google-business', 'pack-avis', 'rapport-stats', 'simulateur', 'seo-local'],
    description: 'Essentiel + visibilité + simulateur + SEO local.',
  },
  {
    id: 'restaurant',
    slug: 'pack-restaurant',
    name: 'Pack Restaurant',
    priceMonthly: 69.9,
    stripePriceId: process.env.STRIPE_PRICE_PACK_RESTAURANT || '',
    badge: null,
    optionIds: ['click-collect', 'reservation', 'pack-avis'],
    description: 'Essentiel + commande en ligne + réservation + avis.',
  },
  {
    id: 'croissance',
    slug: 'pack-croissance',
    name: 'Pack Croissance',
    priceMonthly: 119.9,
    stripePriceId: process.env.STRIPE_PRICE_PACK_CROISSANCE || '',
    badge: null,
    replacesPackId: 'artisan-pro',
    optionIds: ['google-business', 'pack-avis', 'rapport-stats', 'simulateur', 'seo-local', 'google-ads'],
    description: 'Artisan Pro + gestion Google Ads.',
  },
];

/** Upsell recommandations par métier (espace client) */
export const METIER_UPSELLS = {
  restaurant: ['click-collect', 'reservation', 'pack-avis'],
  artisan: ['simulateur', 'seo-local', 'google-business'],
  commerce: ['ecommerce', 'meta-ads', 'pack-avis'],
  default: ['google-business', 'rapport-stats', 'reservation'],
};

export function getAllOptionsFlat() {
  return OPTION_CATEGORIES.flatMap((c) =>
    c.options.map((o) => ({ ...o, categoryId: c.id, categoryLabel: c.label })),
  );
}

export function getOptionById(id) {
  return getAllOptionsFlat().find((o) => o.id === id);
}

export function packRetailSum(pack) {
  let sum = BASE_PLAN.priceMonthly;
  for (const oid of pack.optionIds) {
    const opt = getOptionById(oid);
    if (opt) sum += opt.priceMonthly;
  }
  return Math.round(sum * 100) / 100;
}

export function pricingForClient() {
  return {
    legal: LEGAL,
    contact: CONTACT,
    base: {
      ...BASE_PLAN,
      stripePriceId: undefined,
    },
    categories: OPTION_CATEGORIES.map((cat) => ({
      ...cat,
      options: cat.options.map(({ stripePriceId, ...rest }) => rest),
    })),
    packs: PACKS.map((p) => ({
      ...p,
      retailSum: packRetailSum(p),
      savings: Math.round((packRetailSum(p) - p.priceMonthly) * 100) / 100,
      stripePriceId: undefined,
    })),
    metierUpsells: METIER_UPSELLS,
  };
}
