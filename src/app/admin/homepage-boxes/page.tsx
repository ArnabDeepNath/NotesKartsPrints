"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toaster";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import {
  DEFAULT_SITE_SETTINGS,
  type CategoryTile,
  type SiteSettings,
} from "@/lib/site-settings";
import {
  buildCategoryMap,
  buildMenuTargetGroups,
  createMenuItemId,
  flattenCategories,
  parseMenuTargetValue,
  resolveCategoryTile,
  type ManagedCategory,
} from "@/lib/category-menu";

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

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function AdminHomepageBoxesPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { refreshSettings } = useSiteSettings();
  const router = useRouter();

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsResponse, categoriesResponse] = await Promise.all([
          api.settings.adminGet(),
          api.categories.getAll(),
        ]);

        setSettings(settingsResponse.settings || DEFAULT_SITE_SETTINGS);
        setCategories(
          Array.isArray(categoriesResponse)
            ? (categoriesResponse as ManagedCategory[])
            : [],
        );
      } catch (error: unknown) {
        toast(getErrorMessage(error, "Failed to load homepage boxes"), "error");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "ADMIN") {
      load();
    }
  }, [toast, user]);

  const categoryMap = useMemo(() => buildCategoryMap(categories), [categories]);
  const targetGroups = useMemo(
    () => buildMenuTargetGroups(categories),
    [categories],
  );
  const flatCategories = useMemo(
    () => flattenCategories(categories),
    [categories],
  );

  const updateTiles = (categoryTiles: CategoryTile[]) => {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        categoryTiles,
      },
    }));
  };

  const applyTargetSelection = (tile: CategoryTile, selectionValue: string) => {
    // Handle policy page selections (format: "policy::{slug}")
    if (selectionValue.startsWith("policy::")) {
      const policySlug = selectionValue.replace("policy::", "");
      const policyPage = settings.policyPages.find((p) => p.slug === policySlug);
      if (policyPage) {
        return {
          ...tile,
          name: policyPage.label,
          href: `/policy/${policyPage.slug}`,
          targetType: "custom" as const,
          targetId: null,
        };
      }
      return tile;
    }

    const target = parseMenuTargetValue(selectionValue);
    if (!target) {
      return tile;
    }

    const category = categoryMap.get(target.targetId);

    return {
      ...tile,
      name: category?.name || tile.name,
      href:
        target.targetType === "category"
          ? `/books?category=${category?.slug || ""}`
          : `/books?subcategory=${category?.slug || ""}`,
      targetType: target.targetType,
      targetId: target.targetId,
    };
  };

  const addTile = () => {
    const firstCategory = flatCategories.find((category) => !category.parentId);

    updateTiles([
      ...settings.homepage.categoryTiles,
      firstCategory
        ? {
            id: createMenuItemId("tile"),
            name: firstCategory.name,
            icon: CATEGORY_ICON_OPTIONS[0],
            href: `/books?category=${firstCategory.slug}`,
            color: "#e8f5e9",
            targetType: "category",
            targetId: firstCategory.id,
          }
        : {
            id: createMenuItemId("tile"),
            name: "",
            icon: CATEGORY_ICON_OPTIONS[0],
            href: "",
            color: "#e8f5e9",
            targetType: "custom",
            targetId: null,
          },
    ]);
  };

  const removeTile = (id: string) => {
    updateTiles(
      settings.homepage.categoryTiles.filter((tile) => tile.id !== id),
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.settings.adminUpdate({
        homepage: {
          ...settings.homepage,
          categoryTiles: settings.homepage.categoryTiles,
        },
      });
      setSettings(response.settings);
      await refreshSettings();
      toast("Homepage boxes updated", "success");
    } catch (error: unknown) {
      toast(getErrorMessage(error, "Failed to save homepage boxes"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-[#232f3e]"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold text-[#232f3e]">
              Homepage Boxes
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Control the category and subcategory boxes shown on the landing
              page under the hero.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="px-5 py-3 rounded bg-[#e47911] text-white text-sm font-semibold hover:bg-[#c45500] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Boxes"}
          </button>
        </div>

        <section className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-[#232f3e]">
                Landing Page Boxes
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Pick a category or subcategory for each box, then choose its
                icon and accent color.
              </p>
            </div>
            <button
              type="button"
              onClick={addTile}
              disabled={!flatCategories.length}
              className="px-4 py-2 rounded bg-[#e47911] text-white text-sm font-medium hover:bg-[#c45500] disabled:opacity-50"
            >
              Add Box
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">
              Loading homepage boxes...
            </div>
          ) : !flatCategories.length ? (
            <div className="rounded border border-[#ffe0b2] bg-[#fff8f1] px-4 py-3 text-sm text-[#8a5a15]">
              Create categories and subcategories first. Then you can add them
              to the landing page here.
            </div>
          ) : settings.homepage.categoryTiles.length === 0 ? (
            <div className="rounded border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
              No homepage boxes configured yet.
            </div>
          ) : (
            <div className="space-y-4">
              {settings.homepage.categoryTiles.map((tile, index) => {
                const resolved = resolveCategoryTile(tile, categoryMap);
                // Check if this tile links to a policy page
                const policyPage = settings.policyPages.find(
                  (p) => `/policy/${p.slug}` === tile.href
                );
                const selectedValue = policyPage
                  ? `policy::${policyPage.slug}`
                  : tile.targetType !== "custom" && tile.targetId
                    ? `${tile.targetType}::${tile.targetId}`
                    : "";

                return (
                  <div
                    key={tile.id}
                    className="rounded-xl border border-gray-200 p-4 bg-gray-50/60"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm font-semibold text-[#232f3e]">
                          Box {index + 1}
                        </p>
                        <p className="text-xs text-gray-500">
                          {resolved.missingTarget
                            ? "Target missing. Pick a new category or subcategory."
                            : `Redirects to ${resolved.href || "the selected target"}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTile(tile.id)}
                        className="px-4 py-2 rounded border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <label className="block text-sm font-medium text-[#232f3e] lg:col-span-2">
                        <span className="block mb-2">
                          Category or Subcategory
                        </span>
                        <select
                          value={selectedValue}
                          onChange={(event) =>
                            updateTiles(
                              settings.homepage.categoryTiles.map(
                                (currentTile) =>
                                  currentTile.id === tile.id
                                    ? applyTargetSelection(
                                        currentTile,
                                        event.target.value,
                                      )
                                    : currentTile,
                              ),
                            )
                          }
                          className="w-full rounded border border-gray-300 px-4 py-3 text-sm text-gray-800 bg-white"
                        >
                          <option value="">Select a target</option>
                          {targetGroups.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                              {group.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          
                          {/* Policy Pages Section */}
                          <optgroup label="Policy Pages">
                            {settings.policyPages.map((page) => (
                              <option key={`policy-${page.id}`} value={`policy::${page.slug}`}>
                                {page.label}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </label>

                      <label className="block text-sm font-medium text-[#232f3e]">
                        <span className="block mb-2">Icon</span>
                        <select
                          value={tile.icon}
                          onChange={(event) =>
                            updateTiles(
                              settings.homepage.categoryTiles.map(
                                (currentTile) =>
                                  currentTile.id === tile.id
                                    ? {
                                        ...currentTile,
                                        icon: event.target.value,
                                      }
                                    : currentTile,
                              ),
                            )
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

                      <label className="block text-sm font-medium text-[#232f3e]">
                        <span className="block mb-2">Color</span>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={tile.color}
                            onChange={(event) =>
                              updateTiles(
                                settings.homepage.categoryTiles.map(
                                  (currentTile) =>
                                    currentTile.id === tile.id
                                      ? {
                                          ...currentTile,
                                          color: event.target.value,
                                        }
                                      : currentTile,
                                ),
                              )
                            }
                            className="h-11 w-14 rounded border border-gray-300 bg-white"
                          />
                          <input
                            type="text"
                            value={tile.color}
                            onChange={(event) =>
                              updateTiles(
                                settings.homepage.categoryTiles.map(
                                  (currentTile) =>
                                    currentTile.id === tile.id
                                      ? {
                                          ...currentTile,
                                          color: event.target.value,
                                        }
                                      : currentTile,
                                ),
                              )
                            }
                            className="flex-1 rounded border border-gray-300 px-4 py-3 text-sm text-gray-800 bg-white"
                          />
                        </div>
                      </label>
                    </div>

                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <div className="rounded border border-gray-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Label Preview
                        </p>
                        <p className="mt-2 text-sm font-medium text-[#232f3e]">
                          {resolved.name || "Select a target"}
                        </p>
                      </div>
                      <div className="rounded border border-gray-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          URL Preview
                        </p>
                        <p className="mt-2 text-sm font-medium text-[#232f3e] break-all">
                          {resolved.href ||
                            "Generated automatically after selection"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
