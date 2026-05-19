"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toaster";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/site-settings";

const toJson = (value: unknown) => JSON.stringify(value, null, 2);
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { refreshSettings } = useSiteSettings();
  const router = useRouter();

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [jsonFields, setJsonFields] = useState({
    headerLinks: toJson(DEFAULT_SITE_SETTINGS.header.infoBarLinks),
    footerLinks: toJson(DEFAULT_SITE_SETTINGS.footer.quickLinks),
    policies: toJson(DEFAULT_SITE_SETTINGS.footer.policies),
    socials: toJson(DEFAULT_SITE_SETTINGS.footer.socialLinks),
    heroSlides: toJson(DEFAULT_SITE_SETTINGS.homepage.heroSlides),
    categoryTiles: toJson(DEFAULT_SITE_SETTINGS.homepage.categoryTiles),
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.settings.adminGet();
        const next = res.settings || DEFAULT_SITE_SETTINGS;
        setSettings(next);
        setJsonFields({
          headerLinks: toJson(next.header.infoBarLinks),
          footerLinks: toJson(next.footer.quickLinks),
          policies: toJson(next.footer.policies),
          socials: toJson(next.footer.socialLinks),
          heroSlides: toJson(next.homepage.heroSlides),
          categoryTiles: toJson(next.homepage.categoryTiles),
        });
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
      const payload: SiteSettings = {
        ...settings,
        header: {
          ...settings.header,
          infoBarLinks: JSON.parse(jsonFields.headerLinks),
        },
        footer: {
          ...settings.footer,
          quickLinks: JSON.parse(jsonFields.footerLinks),
          policies: JSON.parse(jsonFields.policies),
          socialLinks: JSON.parse(jsonFields.socials),
        },
        homepage: {
          ...settings.homepage,
          heroSlides: JSON.parse(jsonFields.heroSlides),
          categoryTiles: JSON.parse(jsonFields.categoryTiles),
        },
      };

      const res = await api.settings.adminUpdate(payload);
      setSettings(res.settings);
      await refreshSettings();
      toast("Settings updated", "success");
    } catch (err: unknown) {
      toast(
        getErrorMessage(err, "Invalid JSON or failed to save settings"),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
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

            <section className="bg-white border border-gray-200 rounded-md p-6 grid gap-4">
              <h2 className="text-lg font-semibold text-[#232f3e]">
                Advanced JSON Blocks
              </h2>
              <JsonArea
                label="Header Links"
                value={jsonFields.headerLinks}
                onChange={(value) =>
                  setJsonFields((prev) => ({ ...prev, headerLinks: value }))
                }
              />
              <JsonArea
                label="Footer Quick Links"
                value={jsonFields.footerLinks}
                onChange={(value) =>
                  setJsonFields((prev) => ({ ...prev, footerLinks: value }))
                }
              />
              <JsonArea
                label="Policy Links"
                value={jsonFields.policies}
                onChange={(value) =>
                  setJsonFields((prev) => ({ ...prev, policies: value }))
                }
              />
              <JsonArea
                label="Social Links / Handles"
                value={jsonFields.socials}
                onChange={(value) =>
                  setJsonFields((prev) => ({ ...prev, socials: value }))
                }
              />
              <JsonArea
                label="Hero Slides"
                value={jsonFields.heroSlides}
                onChange={(value) =>
                  setJsonFields((prev) => ({ ...prev, heroSlides: value }))
                }
              />
              <JsonArea
                label="Homepage Category Tiles"
                value={jsonFields.categoryTiles}
                onChange={(value) =>
                  setJsonFields((prev) => ({ ...prev, categoryTiles: value }))
                }
              />
            </section>
          </div>
        )}
      </div>
    </div>
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

function JsonArea({
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
        rows={10}
        className="w-full rounded border border-gray-300 px-4 py-3 text-sm font-mono text-gray-800"
      />
    </label>
  );
}
