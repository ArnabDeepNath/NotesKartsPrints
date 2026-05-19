const prisma = require("../config/prisma");

const SITE_SETTINGS_KEY = "site_config";

const DEFAULT_SITE_SETTINGS = {
  pricing: {
    taxRate: 18,
    shippingCost: 49,
    freeShippingThreshold: 499,
    codEnabled: true,
    codAdvancePercent: 40,
  },
  printing: {
    bwLazerPrice: 2,
    bwInktankPrice: 1,
    colorLazerPrice: 10,
    colorInktankPrice: 5,
    paperPrices: {
      "70_GSM": 0,
      "75_GSM": 0.5,
      "80_GSM": 1,
      "100_GSM": 2,
      "120_GSM": 3,
    },
    bindingPrices: {
      NONE: 0,
      SPIRAL: 50,
      SOFTBOUND: 100,
      HARDBOUND: 150,
    },
  },
  footer: {
    brandName: "NoteKart Prints",
    supportPhone: "+91-877-239-2418",
    supportEmail: "print@notekart.in",
    alternatePhone: "+91-9643239402",
    supportHours: "Mon-Sat 10AM-6PM",
    supportText:
      "Need assistance or special requests? Reach out to our support team.",
    dispatchNote:
      "Printing only on demand. You will receive a tracking ID as soon as your order is dispatched.",
    deliveryNote: "Delivery typically takes 4-7 days after dispatch.",
    refundNote: "Orders cannot be cancelled or refunded once purchased.",
    copyrightText: "All Rights Reserved.",
    guaranteeText: "Printing Only on Demand - Quality Guaranteed",
    quickLinks: [
      { label: "Home", href: "/" },
      { label: "Track My Order", href: "/user/orders" },
      { label: "Shop Books", href: "/books" },
      { label: "Print Documents", href: "/print" },
    ],
    policies: [
      { label: "Terms & Conditions", href: "#" },
      { label: "Shipping Policy", href: "#" },
      { label: "Cancellation Policy", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
      youtube: "",
      whatsapp: "",
    },
  },
  header: {
    brandName: "NoteKart",
    brandAccent: "Prints",
    infoBarLinks: [
      { label: "HOW IT WORKS?", href: "/#how-it-works" },
      { label: "FAQs", href: "/#faqs" },
      { label: "OFFERS", href: "/books?offers=true" },
    ],
    emailLabel: "EMAIL: PRINT@NOTEKART.IN",
    emailHref: "mailto:print@notekart.in",
    trackOrderLabel: "TRACK ORDER",
  },
  homepage: {
    announcementText:
      "Enjoy 25% OFF for new users | 12% OFF for returning customers | FREE delivery above Rs.499",
    announcementLinkLabel: "Print smart, save more ->",
    announcementLinkHref: "/books?offers=true",
    heroSlides: [
      {
        title: "Customize, Print & Get Your Notes",
        subtitle: "Delivered right to your doorstep!",
        bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
        accent: "#e47911",
        cta: "Shop Now",
        href: "/books",
        badge: "NEW ARRIVALS",
        image: "",
      },
      {
        title: "NEET PG Revision Notes",
        subtitle: "All 19 Subjects - Full Colour HD Printing",
        bg: "linear-gradient(135deg, #0d1b2a 0%, #1b4332 50%, #0d1b2a 100%)",
        accent: "#f5a623",
        cta: "Order Now",
        href: "/books?category=neet-pg",
        badge: "BESTSELLER",
        image: "",
      },
      {
        title: "Rapid Revision 2026-27",
        subtitle: "All Subjects Full Colour - Dispatch in 24 hrs",
        bg: "linear-gradient(135deg, #2d0036 0%, #6d28d9 50%, #2d0036 100%)",
        accent: "#f5a623",
        cta: "Explore",
        href: "/books?category=rapid-revision",
        badge: "HOT DEAL",
        image: "",
      },
    ],
    categoryTiles: [
      {
        name: "NEET PG Full Notes",
        icon: "📗",
        href: "/books?category=neet-pg",
        color: "#e8f5e9",
      },
      {
        name: "Rapid Revision",
        icon: "⚡",
        href: "/books?category=rapid-revision",
        color: "#fff3e0",
      },
      {
        name: "BTR Notes",
        icon: "📘",
        href: "/books?category=btr-notes",
        color: "#e3f2fd",
      },
      {
        name: "Super Speciality",
        icon: "🔬",
        href: "/books?category=super-speciality",
        color: "#f3e5f5",
      },
      {
        name: "USMLE Notes",
        icon: "🏥",
        href: "/books?category=usmle",
        color: "#fce4ec",
      },
      {
        name: "Other Notes",
        icon: "📋",
        href: "/books?category=other",
        color: "#e0f7fa",
      },
    ],
  },
  logistics: {
    provider: "shiprocket",
    shiprocketEnabled: false,
    shiprocketEmail: "",
    shiprocketPassword: "",
    pickupLocation: "Primary",
    channelId: "",
  },
};

const isRecord = (value) =>
  !!value && typeof value === "object" && !Array.isArray(value);

const deepMerge = (base, override) => {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? override : base;
  }

  if (!isRecord(base)) {
    return override === undefined ? base : override;
  }

  const merged = { ...base };
  const source = isRecord(override) ? override : {};

  for (const [key, value] of Object.entries(source)) {
    merged[key] = key in base ? deepMerge(base[key], value) : value;
  }

  return merged;
};

const sanitizeNumeric = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeSiteSettings = (input = {}) => {
  const merged = deepMerge(DEFAULT_SITE_SETTINGS, input);

  merged.pricing.taxRate = sanitizeNumeric(
    merged.pricing.taxRate,
    DEFAULT_SITE_SETTINGS.pricing.taxRate,
  );
  merged.pricing.shippingCost = sanitizeNumeric(
    merged.pricing.shippingCost,
    DEFAULT_SITE_SETTINGS.pricing.shippingCost,
  );
  merged.pricing.freeShippingThreshold = sanitizeNumeric(
    merged.pricing.freeShippingThreshold,
    DEFAULT_SITE_SETTINGS.pricing.freeShippingThreshold,
  );
  merged.pricing.codAdvancePercent = sanitizeNumeric(
    merged.pricing.codAdvancePercent,
    DEFAULT_SITE_SETTINGS.pricing.codAdvancePercent,
  );
  merged.pricing.codEnabled = Boolean(merged.pricing.codEnabled);
  merged.logistics.shiprocketEnabled = Boolean(
    merged.logistics.shiprocketEnabled,
  );

  for (const key of Object.keys(DEFAULT_SITE_SETTINGS.printing.paperPrices)) {
    merged.printing.paperPrices[key] = sanitizeNumeric(
      merged.printing.paperPrices[key],
      DEFAULT_SITE_SETTINGS.printing.paperPrices[key],
    );
  }

  for (const key of Object.keys(DEFAULT_SITE_SETTINGS.printing.bindingPrices)) {
    merged.printing.bindingPrices[key] = sanitizeNumeric(
      merged.printing.bindingPrices[key],
      DEFAULT_SITE_SETTINGS.printing.bindingPrices[key],
    );
  }

  merged.printing.bwLazerPrice = sanitizeNumeric(
    merged.printing.bwLazerPrice,
    DEFAULT_SITE_SETTINGS.printing.bwLazerPrice,
  );
  merged.printing.bwInktankPrice = sanitizeNumeric(
    merged.printing.bwInktankPrice,
    DEFAULT_SITE_SETTINGS.printing.bwInktankPrice,
  );
  merged.printing.colorLazerPrice = sanitizeNumeric(
    merged.printing.colorLazerPrice,
    DEFAULT_SITE_SETTINGS.printing.colorLazerPrice,
  );
  merged.printing.colorInktankPrice = sanitizeNumeric(
    merged.printing.colorInktankPrice,
    DEFAULT_SITE_SETTINGS.printing.colorInktankPrice,
  );

  return merged;
};

const getSiteSettings = async () => {
  const row = await prisma.setting.findUnique({
    where: { key: SITE_SETTINGS_KEY },
  });
  if (!row?.value) {
    return DEFAULT_SITE_SETTINGS;
  }

  try {
    return normalizeSiteSettings(JSON.parse(row.value));
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
};

const saveSiteSettings = async (value) => {
  const normalized = normalizeSiteSettings(value);
  await prisma.setting.upsert({
    where: { key: SITE_SETTINGS_KEY },
    create: { key: SITE_SETTINGS_KEY, value: JSON.stringify(normalized) },
    update: { value: JSON.stringify(normalized) },
  });
  return normalized;
};

const getPublicSiteSettings = (settings) => ({
  pricing: settings.pricing,
  printing: settings.printing,
  footer: settings.footer,
  header: settings.header,
  homepage: settings.homepage,
  logistics: {
    provider: settings.logistics.provider,
    shiprocketEnabled: settings.logistics.shiprocketEnabled,
  },
});

module.exports = {
  DEFAULT_SITE_SETTINGS,
  getPublicSiteSettings,
  getSiteSettings,
  normalizeSiteSettings,
  saveSiteSettings,
};
