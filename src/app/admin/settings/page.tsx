"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toaster";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import {
  DEFAULT_SITE_SETTINGS,
  type CategoryTile,
  type HeroSlide,
  type SiteLink,
  type SiteSettings,
} from "@/lib/site-settings";

const SOCIAL_FIELDS = [
  { key: "facebook", label: "Facebook URL" },
  { key: "instagram", label: "Instagram URL" },
  { key: "twitter", label: "Twitter / X URL" },
  { key: "linkedin", label: "LinkedIn URL" },
  { key: "youtube", label: "YouTube URL" },
  { key: "whatsapp", label: "WhatsApp URL" },
] as const;

const CATEGORY_ICON_OPTIONS = [
  "📗",
  "⚡",
  "📘",
  "🔬",
  "🏥",
  "📋",
  "🦷",
  "📄",
  "📚",
  "🩺",
];

type FooterLinkKey = "quickLinks" | "policies";
type FooterSocialKey = keyof SiteSettings["footer"]["socialLinks"];

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { refreshSettings } = useSiteSettings();
  const router = useRouter();

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.settings.adminGet();
        setSettings(res.settings || DEFAULT_SITE_SETTINGS);
      } catch (err: unknown) {
        toast(getErrorMessage(err, "Failed to load settings"), "error");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "ADMIN") {
      loadSettings();
    }
  }, [toast, user]);

  const updateSection = <K extends keyof SiteSettings>(
    section: K,
    value: SiteSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [section]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await api.settings.adminUpdate(settings);
      setSettings(res.settings);
      await refreshSettings();
      toast("Settings updated", "success");
    } catch (err: unknown) {
      toast(getErrorMessage(err, "Failed to save settings"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const updateHeaderLinkList = (
    index: number,
    field: keyof SiteLink,
    value: string,
  ) => {
    const next = settings.header.infoBarLinks.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    );

    updateSection("header", {
      ...settings.header,
      infoBarLinks: next,
    });
  };

  const addHeaderLinkItem = () => {
    updateSection("header", {
      ...settings.header,
      infoBarLinks: [...settings.header.infoBarLinks, { label: "", href: "" }],
    });
  };

  const removeHeaderLinkItem = (index: number) => {
    updateSection("header", {
      ...settings.header,
      infoBarLinks: settings.header.infoBarLinks.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    });
  };

  const updateFooterLinkList = (
    key: FooterLinkKey,
    index: number,
    field: keyof SiteLink,
    value: string,
  ) => {
    const next = settings.footer[key].map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    );

    updateSection("footer", {
      ...settings.footer,
      [key]: next,
    });
  };

  const addFooterLinkItem = (key: FooterLinkKey) => {
    updateSection("footer", {
      ...settings.footer,
      [key]: [...settings.footer[key], { label: "", href: "" }],
    });
  };

  const removeFooterLinkItem = (key: FooterLinkKey, index: number) => {
    updateSection("footer", {
      ...settings.footer,
      [key]: settings.footer[key].filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const updateHeroSlide = (
    index: number,
    field: keyof HeroSlide,
    value: string,
  ) => {
    updateSection("homepage", {
      ...settings.homepage,
      heroSlides: settings.homepage.heroSlides.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, [field]: value } : slide,
      ),
    });
  };

  const addHeroSlide = () => {
    updateSection("homepage", {
      ...settings.homepage,
      heroSlides: [
        ...settings.homepage.heroSlides,
        {
          title: "",
          subtitle: "",
          bg: "linear-gradient(135deg, #232f3e 0%, #37475a 100%)",
          accent: "#e47911",
          cta: "Shop Now",
          href: "/books",
          badge: "FEATURED",
          image: "",
        },
      ],
    });
  };

  const removeHeroSlide = (index: number) => {
    updateSection("homepage", {
      ...settings.homepage,
      heroSlides: settings.homepage.heroSlides.filter(
        (_, slideIndex) => slideIndex !== index,
      ),
    });
  };

  const uploadHeroImage = async (index: number, file: File) => {
    try {
      setUploadingSlideIndex(index);
      const uploadData = new FormData();
      uploadData.append("image", file);
      const res = await api.upload.image(uploadData);
      updateHeroSlide(index, "image", res.url);
      toast("Slide image uploaded", "success");
    } catch (err: unknown) {
      toast(getErrorMessage(err, "Image upload failed"), "error");
    } finally {
      setUploadingSlideIndex(null);
    }
  };

  const updateCategoryTile = (
    index: number,
    field: keyof CategoryTile,
    value: string,
  ) => {
    updateSection("homepage", {
      ...settings.homepage,
      categoryTiles: settings.homepage.categoryTiles.map((tile, tileIndex) =>
        tileIndex === index ? { ...tile, [field]: value } : tile,
      ),
    });
  };

  const addCategoryTile = () => {
    updateSection("homepage", {
      ...settings.homepage,
      categoryTiles: [
        ...settings.homepage.categoryTiles,
        {
          name: "",
          icon: CATEGORY_ICON_OPTIONS[0],
          href: "/books",
          color: "#e8f5e9",
        },
      ],
    });
  };

  const removeCategoryTile = (index: number) => {
    updateSection("homepage", {
      ...settings.homepage,
      categoryTiles: settings.homepage.categoryTiles.filter(
        (_, tileIndex) => tileIndex !== index,
      ),
    });
  };

  const updateSocialField = (field: FooterSocialKey, value: string) => {
    updateSection("footer", {
      ...settings.footer,
      socialLinks: {
        ...settings.footer.socialLinks,
        [field]: value,
      },
    });
  };

  if (authLoading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-[#232f3e]"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-[#232f3e] mt-3">
              Site Settings
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Manage footer, header, homepage content, taxes, shipping, COD,
              printing prices and Shiprocket credentials.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading || isSaving}
            className="px-5 py-3 rounded bg-[#e47911] text-white text-sm font-semibold hover:bg-[#c45500] disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-md p-8 text-gray-500">
            Loading settings...
          </div>
        ) : (
          <div className="grid gap-6">
            <section className="bg-white border border-gray-200 rounded-md p-6 grid md:grid-cols-2 gap-4">
              <h2 className="md:col-span-2 text-lg font-semibold text-[#232f3e]">
                Pricing and COD
              </h2>
              <LabeledInput
                label="Tax Rate (%)"
                type="number"
                value={settings.pricing.taxRate}
                onChange={(value) =>
                  updateSection("pricing", {
                    ...settings.pricing,
                    taxRate: Number(value),
                  })
                }
              />
              <LabeledInput
                label="Shipping Cost"
                type="number"
                value={settings.pricing.shippingCost}
                onChange={(value) =>
                  updateSection("pricing", {
                    ...settings.pricing,
                    shippingCost: Number(value),
                  })
                }
              />
              <LabeledInput
                label="Free Shipping Threshold"
                type="number"
                value={settings.pricing.freeShippingThreshold}
                onChange={(value) =>
                  updateSection("pricing", {
                    ...settings.pricing,
                    freeShippingThreshold: Number(value),
                  })
                }
              />
              <LabeledInput
                label="COD Advance Percent"
                type="number"
                value={settings.pricing.codAdvancePercent}
                onChange={(value) =>
                  updateSection("pricing", {
                    ...settings.pricing,
                    codAdvancePercent: Number(value),
                  })
                }
              />
              <label className="flex items-center gap-3 text-sm font-medium text-[#232f3e] md:col-span-2">
                <input
                  type="checkbox"
                  checked={settings.pricing.codEnabled}
                  onChange={(e) =>
                    updateSection("pricing", {
                      ...settings.pricing,
                      codEnabled: e.target.checked,
                    })
                  }
                />
                Enable COD on the website
              </label>
            </section>

            <section className="bg-white border border-gray-200 rounded-md p-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <h2 className="md:col-span-2 lg:col-span-4 text-lg font-semibold text-[#232f3e]">
                Printing Prices
              </h2>
              <LabeledInput
                label="BW Laser / page"
                type="number"
                value={settings.printing.bwLazerPrice}
                onChange={(value) =>
                  updateSection("printing", {
                    ...settings.printing,
                    bwLazerPrice: Number(value),
                  })
                }
              />
              <LabeledInput
                label="BW Inktank / page"
                type="number"
                value={settings.printing.bwInktankPrice}
                onChange={(value) =>
                  updateSection("printing", {
                    ...settings.printing,
                    bwInktankPrice: Number(value),
                  })
                }
              />
              <LabeledInput
                label="Color Laser / page"
                type="number"
                value={settings.printing.colorLazerPrice}
                onChange={(value) =>
                  updateSection("printing", {
                    ...settings.printing,
                    colorLazerPrice: Number(value),
                  })
                }
              />
              <LabeledInput
                label="Color Inktank / page"
                type="number"
                value={settings.printing.colorInktankPrice}
                onChange={(value) =>
                  updateSection("printing", {
                    ...settings.printing,
                    colorInktankPrice: Number(value),
                  })
                }
              />
            </section>

            <section className="bg-white border border-gray-200 rounded-md p-6 grid md:grid-cols-2 gap-4">
              <h2 className="md:col-span-2 text-lg font-semibold text-[#232f3e]">
                Header and Footer
              </h2>
              <LabeledInput
                label="Header Brand Name"
                value={settings.header.brandName}
                onChange={(value) =>
                  updateSection("header", {
                    ...settings.header,
                    brandName: value,
                  })
                }
              />
              <LabeledInput
                label="Header Brand Accent"
                value={settings.header.brandAccent}
                onChange={(value) =>
                  updateSection("header", {
                    ...settings.header,
                    brandAccent: value,
                  })
                }
              />
              <LabeledInput
                label="Top Email Label"
                value={settings.header.emailLabel}
                onChange={(value) =>
                  updateSection("header", {
                    ...settings.header,
                    emailLabel: value,
                  })
                }
              />
              <LabeledInput
                label="Top Email Link"
                value={settings.header.emailHref}
                onChange={(value) =>
                  updateSection("header", {
                    ...settings.header,
                    emailHref: value,
                  })
                }
              />
              <LabeledInput
                label="Footer Brand Name"
                value={settings.footer.brandName}
                onChange={(value) =>
                  updateSection("footer", {
                    ...settings.footer,
                    brandName: value,
                  })
                }
              />
              <LabeledInput
                label="Support Phone"
                value={settings.footer.supportPhone}
                onChange={(value) =>
                  updateSection("footer", {
                    ...settings.footer,
                    supportPhone: value,
                  })
                }
              />
              <LabeledInput
                label="Support Email"
                value={settings.footer.supportEmail}
                onChange={(value) =>
                  updateSection("footer", {
                    ...settings.footer,
                    supportEmail: value,
                  })
                }
              />
              <LabeledInput
                label="Alternate Phone"
                value={settings.footer.alternatePhone}
                onChange={(value) =>
                  updateSection("footer", {
                    ...settings.footer,
                    alternatePhone: value,
                  })
                }
              />
              <LabeledInput
                label="Support Hours"
                value={settings.footer.supportHours}
                onChange={(value) =>
                  updateSection("footer", {
                    ...settings.footer,
                    supportHours: value,
                  })
                }
              />
              <TextArea
                label="Support Text"
                value={settings.footer.supportText}
                onChange={(value) =>
                  updateSection("footer", {
                    ...settings.footer,
                    supportText: value,
                  })
                }
              />
              <TextArea
                label="Dispatch Note"
                value={settings.footer.dispatchNote}
                onChange={(value) =>
                  updateSection("footer", {
                    ...settings.footer,
                    dispatchNote: value,
                  })
                }
              />
              <TextArea
                label="Delivery Note"
                value={settings.footer.deliveryNote}
                onChange={(value) =>
                  updateSection("footer", {
                    ...settings.footer,
                    deliveryNote: value,
                  })
                }
              />
              <TextArea
                label="Refund Note"
                value={settings.footer.refundNote}
                onChange={(value) =>
                  updateSection("footer", {
                    ...settings.footer,
                    refundNote: value,
                  })
                }
              />
            </section>

            <section className="bg-white border border-gray-200 rounded-md p-6 grid md:grid-cols-2 gap-4">
              <h2 className="md:col-span-2 text-lg font-semibold text-[#232f3e]">
                Homepage Content
              </h2>
              <TextArea
                label="Announcement Text"
                value={settings.homepage.announcementText}
                onChange={(value) =>
                  updateSection("homepage", {
                    ...settings.homepage,
                    announcementText: value,
                  })
                }
              />
              <LabeledInput
                label="Announcement Link Label"
                value={settings.homepage.announcementLinkLabel}
                onChange={(value) =>
                  updateSection("homepage", {
                    ...settings.homepage,
                    announcementLinkLabel: value,
                  })
                }
              />
              <LabeledInput
                label="Announcement Link Href"
                value={settings.homepage.announcementLinkHref}
                onChange={(value) =>
                  updateSection("homepage", {
                    ...settings.homepage,
                    announcementLinkHref: value,
                  })
                }
              />
            </section>

            <section className="bg-white border border-gray-200 rounded-md p-6 grid md:grid-cols-2 gap-4">
              <h2 className="md:col-span-2 text-lg font-semibold text-[#232f3e]">
                Shiprocket Logistics
              </h2>
              <label className="flex items-center gap-3 text-sm font-medium text-[#232f3e] md:col-span-2">
                <input
                  type="checkbox"
                  checked={settings.logistics.shiprocketEnabled}
                  onChange={(e) =>
                    updateSection("logistics", {
                      ...settings.logistics,
                      shiprocketEnabled: e.target.checked,
                    })
                  }
                />
                Enable Shiprocket integration
              </label>
              <LabeledInput
                label="Provider"
                value={settings.logistics.provider}
                onChange={(value) =>
                  updateSection("logistics", {
                    ...settings.logistics,
                    provider: value,
                  })
                }
              />
              <LabeledInput
                label="Shiprocket Email"
                value={settings.logistics.shiprocketEmail || ""}
                onChange={(value) =>
                  updateSection("logistics", {
                    ...settings.logistics,
                    shiprocketEmail: value,
                  })
                }
              />
              <LabeledInput
                label="Shiprocket Password"
                type="password"
                value={settings.logistics.shiprocketPassword || ""}
                onChange={(value) =>
                  updateSection("logistics", {
                    ...settings.logistics,
                    shiprocketPassword: value,
                  })
                }
              />
              <LabeledInput
                label="Pickup Location"
                value={settings.logistics.pickupLocation || ""}
                onChange={(value) =>
                  updateSection("logistics", {
                    ...settings.logistics,
                    pickupLocation: value,
                  })
                }
              />
              <LabeledInput
                label="Channel ID"
                value={settings.logistics.channelId || ""}
                onChange={(value) =>
                  updateSection("logistics", {
                    ...settings.logistics,
                    channelId: value,
                  })
                }
              />
            </section>

            <section className="bg-white border border-gray-200 rounded-md p-6 grid gap-6">
              <div>
                <h2 className="text-lg font-semibold text-[#232f3e]">
                  Easy Content Blocks
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add links, handles, homepage slides and category cards without
                  editing JSON.
                </p>
              </div>

              <EditableLinksCard
                title="Header Links"
                description="These show in the top bar next to the email link."
                items={settings.header.infoBarLinks}
                onAdd={addHeaderLinkItem}
                onChange={updateHeaderLinkList}
                onRemove={removeHeaderLinkItem}
              />

              <EditableLinksCard
                title="Footer Quick Links"
                description="Add common pages for users to click from the footer."
                items={settings.footer.quickLinks}
                onAdd={() => addFooterLinkItem("quickLinks")}
                onChange={(index, field, value) =>
                  updateFooterLinkList("quickLinks", index, field, value)
                }
                onRemove={(index) => removeFooterLinkItem("quickLinks", index)}
              />

              <EditableLinksCard
                title="Footer Policy Links"
                description="Add policy pages or external links for legal and support info."
                items={settings.footer.policies}
                onAdd={() => addFooterLinkItem("policies")}
                onChange={(index, field, value) =>
                  updateFooterLinkList("policies", index, field, value)
                }
                onRemove={(index) => removeFooterLinkItem("policies", index)}
              />

              <section className="rounded-xl border border-gray-200 p-5">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-[#232f3e]">
                    Social Links
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Paste each platform link. Only filled links appear on the
                    site.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {SOCIAL_FIELDS.map((field) => (
                    <LabeledInput
                      key={field.key}
                      label={field.label}
                      value={settings.footer.socialLinks[field.key] || ""}
                      onChange={(value) => updateSocialField(field.key, value)}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-[#232f3e]">
                      Homepage Hero Slides
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Edit banners one by one. You can upload an image instead
                      of pasting raw JSON.
                    </p>
                  </div>
                  <ActionButton label="Add Slide" onClick={addHeroSlide} />
                </div>
                <div className="space-y-4">
                  {settings.homepage.heroSlides.map((slide, index) => (
                    <div
                      key={`${slide.title}-${index}`}
                      className="rounded-lg border border-gray-200 p-4 bg-gray-50/60"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="text-sm font-semibold text-[#232f3e]">
                            Slide {index + 1}
                          </p>
                          <p className="text-xs text-gray-500">
                            Main homepage banner
                          </p>
                        </div>
                        {settings.homepage.heroSlides.length > 1 && (
                          <GhostButton
                            label="Remove"
                            onClick={() => removeHeroSlide(index)}
                          />
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <LabeledInput
                          label="Title"
                          value={slide.title}
                          onChange={(value) =>
                            updateHeroSlide(index, "title", value)
                          }
                        />
                        <LabeledInput
                          label="Badge"
                          value={slide.badge}
                          onChange={(value) =>
                            updateHeroSlide(index, "badge", value)
                          }
                        />
                        <TextArea
                          label="Subtitle"
                          value={slide.subtitle}
                          onChange={(value) =>
                            updateHeroSlide(index, "subtitle", value)
                          }
                        />
                        <LabeledInput
                          label="Button Text"
                          value={slide.cta}
                          onChange={(value) =>
                            updateHeroSlide(index, "cta", value)
                          }
                        />
                        <LabeledInput
                          label="Button Link"
                          value={slide.href}
                          onChange={(value) =>
                            updateHeroSlide(index, "href", value)
                          }
                        />
                        <LabeledInput
                          label="Accent Color"
                          value={slide.accent}
                          onChange={(value) =>
                            updateHeroSlide(index, "accent", value)
                          }
                        />
                        <TextArea
                          label="Background Gradient"
                          value={slide.bg}
                          onChange={(value) =>
                            updateHeroSlide(index, "bg", value)
                          }
                        />
                        <div className="space-y-3">
                          <LabeledInput
                            label="Image URL"
                            value={slide.image || ""}
                            onChange={(value) =>
                              updateHeroSlide(index, "image", value)
                            }
                          />
                          <label className="inline-flex items-center gap-3 rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  uploadHeroImage(index, file);
                                }
                              }}
                            />
                            {uploadingSlideIndex === index
                              ? "Uploading..."
                              : "Upload Slide Image"}
                          </label>
                          {slide.image && (
                            <img
                              src={slide.image}
                              alt={slide.title || `Slide ${index + 1}`}
                              className="h-24 w-full rounded object-cover border border-gray-200"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-[#232f3e]">
                      Homepage Category Tiles
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage the clickable category cards shown below the hero
                      section.
                    </p>
                  </div>
                  <ActionButton label="Add Tile" onClick={addCategoryTile} />
                </div>
                <div className="space-y-4">
                  {settings.homepage.categoryTiles.map((tile, index) => (
                    <div
                      key={`${tile.name}-${index}`}
                      className="rounded-lg border border-gray-200 p-4 bg-gray-50/60"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="text-sm font-semibold text-[#232f3e]">
                            Tile {index + 1}
                          </p>
                          <p className="text-xs text-gray-500">
                            Category card on homepage
                          </p>
                        </div>
                        {settings.homepage.categoryTiles.length > 1 && (
                          <GhostButton
                            label="Remove"
                            onClick={() => removeCategoryTile(index)}
                          />
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <LabeledInput
                          label="Card Title"
                          value={tile.name}
                          onChange={(value) =>
                            updateCategoryTile(index, "name", value)
                          }
                        />
                        <label className="block text-sm font-medium text-[#232f3e]">
                          <span className="block mb-2">Icon</span>
                          <select
                            value={tile.icon}
                            onChange={(e) =>
                              updateCategoryTile(index, "icon", e.target.value)
                            }
                            className="w-full rounded border border-gray-300 px-4 py-3 text-sm text-gray-800 bg-white"
                          >
                            {CATEGORY_ICON_OPTIONS.map((icon) => (
                              <option key={icon} value={icon}>
                                {icon}
                              </option>
                            ))}
                          </select>
                        </label>
                        <LabeledInput
                          label="Card Link"
                          value={tile.href}
                          onChange={(value) =>
                            updateCategoryTile(index, "href", value)
                          }
                        />
                        <div className="block text-sm font-medium text-[#232f3e]">
                          <span className="block mb-2">Card Color</span>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={tile.color}
                              onChange={(e) =>
                                updateCategoryTile(
                                  index,
                                  "color",
                                  e.target.value,
                                )
                              }
                              className="h-11 w-14 rounded border border-gray-300 bg-white"
                            />
                            <input
                              type="text"
                              value={tile.color}
                              onChange={(e) =>
                                updateCategoryTile(
                                  index,
                                  "color",
                                  e.target.value,
                                )
                              }
                              className="flex-1 rounded border border-gray-300 px-4 py-3 text-sm text-gray-800 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function EditableLinksCard({
  title,
  description,
  items,
  onAdd,
  onChange,
  onRemove,
}: {
  title: string;
  description: string;
  items: SiteLink[];
  onAdd: () => void;
  onChange: (index: number, field: keyof SiteLink, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#232f3e]">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <ActionButton label="Add Link" onClick={onAdd} />
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="grid md:grid-cols-[1fr_1.4fr_auto] gap-3 items-end"
          >
            <LabeledInput
              label="Label"
              value={item.label}
              onChange={(value) => onChange(index, "label", value)}
            />
            <LabeledInput
              label="Link"
              value={item.href}
              onChange={(value) => onChange(index, "href", value)}
            />
            {items.length > 1 ? (
              <GhostButton label="Remove" onClick={() => onRemove(index)} />
            ) : (
              <div />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium text-[#232f3e]">
      <span className="block mb-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-4 py-3 text-sm text-gray-800"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-[#232f3e]">
      <span className="block mb-2">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded border border-gray-300 px-4 py-3 text-sm text-gray-800"
      />
    </label>
  );
}

function ActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded bg-[#e47911] text-white text-sm font-medium hover:bg-[#c45500]"
    >
      {label}
    </button>
  );
}

function GhostButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
    >
      {label}
    </button>
  );
}
