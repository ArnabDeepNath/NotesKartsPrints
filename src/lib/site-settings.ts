export interface SiteLink {
  label: string;
  href: string;
}

export type MenuTargetType = "custom" | "category" | "subcategory";

export interface TargetedMenuItem {
  id: string;
  label: string;
  href: string;
  targetType: MenuTargetType;
  targetId: string | null;
}

export interface HeroSlide {
  title: string;
  subtitle: string;
  bg: string;
  accent: string;
  cta: string;
  href: string;
  badge: string;
  image?: string;
}

export interface CategoryTile {
  id: string;
  name: string;
  icon: string;
  href: string;
  color: string;
  targetType: MenuTargetType;
  targetId: string | null;
}

export interface SiteSettings {
  pricing: {
    taxRate: number;
    shippingCost: number;
    freeShippingThreshold: number;
    codEnabled: boolean;
    codAdvancePercent: number;
  };
  printing: {
    bwLazerPrice: number;
    bwInktankPrice: number;
    colorLazerPrice: number;
    colorInktankPrice: number;
    paperPrices: Record<string, number>;
    bindingPrices: Record<string, number>;
  };
  footer: {
    brandName: string;
    supportPhone: string;
    supportEmail: string;
    alternatePhone: string;
    supportHours: string;
    supportText: string;
    dispatchNote: string;
    deliveryNote: string;
    refundNote: string;
    copyrightText: string;
    guaranteeText: string;
    quickLinks: SiteLink[];
    policies: SiteLink[];
    socialLinks: Record<string, string>;
  };
  header: {
    brandName: string;
    brandAccent: string;
    infoBarLinks: SiteLink[];
    navigationMenu: TargetedMenuItem[];
    emailLabel: string;
    emailHref: string;
    trackOrderLabel: string;
  };
  homepage: {
    announcementText: string;
    announcementLinkLabel: string;
    announcementLinkHref: string;
    heroSlides: HeroSlide[];
    categoryTiles: CategoryTile[];
  };
  logistics: {
    provider: string;
    shiprocketEnabled: boolean;
    shiprocketEmail?: string;
    shiprocketPassword?: string;
    pickupLocation?: string;
    channelId?: string;
  };
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
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
    navigationMenu: [],
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
        id: "tile-neet-pg",
        name: "NEET PG Full Notes",
        icon: "📗",
        href: "/books?category=neet-pg",
        color: "#e8f5e9",
        targetType: "custom",
        targetId: null,
      },
      {
        id: "tile-rapid-revision",
        name: "Rapid Revision",
        icon: "⚡",
        href: "/books?category=rapid-revision",
        color: "#fff3e0",
        targetType: "custom",
        targetId: null,
      },
      {
        id: "tile-btr-notes",
        name: "BTR Notes",
        icon: "📘",
        href: "/books?category=btr-notes",
        color: "#e3f2fd",
        targetType: "custom",
        targetId: null,
      },
      {
        id: "tile-super-speciality",
        name: "Super Speciality",
        icon: "🔬",
        href: "/books?category=super-speciality",
        color: "#f3e5f5",
        targetType: "custom",
        targetId: null,
      },
      {
        id: "tile-usmle",
        name: "USMLE Notes",
        icon: "🏥",
        href: "/books?category=usmle",
        color: "#fce4ec",
        targetType: "custom",
        targetId: null,
      },
      {
        id: "tile-other",
        name: "Other Notes",
        icon: "📋",
        href: "/books?category=other",
        color: "#e0f7fa",
        targetType: "custom",
        targetId: null,
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