"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toaster";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import type { SiteSettings, TargetedMenuItem } from "@/lib/site-settings";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings";
import {
  buildCategoryMap,
  buildMenuTargetGroups,
  createMenuItemId,
  flattenCategories,
  parseMenuTargetValue,
  resolveMenuItem,
  type ManagedCategory,
} from "@/lib/category-menu";

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function AdminNavigationPage() {
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
        toast(getErrorMessage(error, "Failed to load navigation menu"), "error");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "ADMIN") {
      load();
    }
  }, [toast, user]);

  const categoryMap = useMemo(() => buildCategoryMap(categories), [categories]);
  const targetGroups = useMemo(() => buildMenuTargetGroups(categories), [categories]);
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const updateNavigationMenu = (navigationMenu: TargetedMenuItem[]) => {
    setSettings((current) => ({
      ...current,
      header: {
        ...current.header,
        navigationMenu,
      },
    }));
  };

  const applyTargetSelection = (item: TargetedMenuItem, selectionValue: string) => {
    const target = parseMenuTargetValue(selectionValue);
    if (!target) {
      return item;
    }

    const category = categoryMap.get(target.targetId);

    return {
      ...item,
      label: category?.name || item.label,
      href:
        target.targetType === "category"
          ? `/books?category=${category?.slug || ""}`
          : `/books?subcategory=${category?.slug || ""}`,
      targetType: target.targetType,
      targetId: target.targetId,
    };
  };

  const addMenuItem = () => {
    const firstCategory = flatCategories.find((category) => !category.parentId);

    updateNavigationMenu([
      ...settings.header.navigationMenu,
      firstCategory
        ? {
            id: createMenuItemId("nav"),
            label: firstCategory.name,
            href: `/books?category=${firstCategory.slug}`,
            targetType: "category",
            targetId: firstCategory.id,
          }
        : {
            id: createMenuItemId("nav"),
            label: "",
            href: "",
            targetType: "custom",
            targetId: null,
          },
    ]);
  };

  const removeMenuItem = (id: string) => {
    updateNavigationMenu(
      settings.header.navigationMenu.filter((item) => item.id !== id),
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.settings.adminUpdate({
        header: {
          ...settings.header,
          navigationMenu: settings.header.navigationMenu,
        },
      });
      setSettings(response.settings);
      await refreshSettings();
      toast("Navigation menu updated", "success");
    } catch (error: unknown) {
      toast(getErrorMessage(error, "Failed to save navigation menu"), "error");
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
            <Link href="/admin" className="text-sm text-gray-500 hover:text-[#232f3e]">
              ← Back to Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold text-[#232f3e]">Navigation Menu</h1>
            <p className="mt-2 text-sm text-gray-500">
              Choose which created categories and subcategories appear in the storefront navbar.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="px-5 py-3 rounded bg-[#e47911] text-white text-sm font-semibold hover:bg-[#c45500] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Menu"}
          </button>
        </div>

        <section className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-[#232f3e]">Navbar Items</h2>
              <p className="text-sm text-gray-500 mt-1">
                Each item points to one category or one subcategory. The storefront link is generated automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={addMenuItem}
              disabled={!flatCategories.length}
              className="px-4 py-2 rounded bg-[#e47911] text-white text-sm font-medium hover:bg-[#c45500] disabled:opacity-50"
            >
              Add Navbar Item
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Loading menu settings...</div>
          ) : !flatCategories.length ? (
            <div className="rounded border border-[#ffe0b2] bg-[#fff8f1] px-4 py-3 text-sm text-[#8a5a15]">
              Create categories and subcategories first. Then you can add them to the navbar here.
            </div>
          ) : settings.header.navigationMenu.length === 0 ? (
            <div className="rounded border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
              No navbar items configured yet.
            </div>
          ) : (
            <div className="space-y-4">
              {settings.header.navigationMenu.map((item, index) => {
                const resolved = resolveMenuItem(item, categoryMap);
                const selectedValue =
                  item.targetType !== "custom" && item.targetId
                    ? `${item.targetType}::${item.targetId}`
                    : "";

                return (
                  <div key={item.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50/60">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm font-semibold text-[#232f3e]">Item {index + 1}</p>
                        <p className="text-xs text-gray-500">
                          {resolved.missingTarget
                            ? "Target missing. Pick a new category or subcategory."
                            : `Redirects to ${resolved.href || "the selected target"}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMenuItem(item.id)}
                        className="px-4 py-2 rounded border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Remove
                      </button>
                    </div>

                    <label className="block text-sm font-medium text-[#232f3e]">
                      <span className="block mb-2">Category or Subcategory</span>
                      <select
                        value={selectedValue}
                        onChange={(event) =>
                          updateNavigationMenu(
                            settings.header.navigationMenu.map((menuItem) =>
                              menuItem.id === item.id
                                ? applyTargetSelection(menuItem, event.target.value)
                                : menuItem,
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
                      </select>
                    </label>

                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <div className="rounded border border-gray-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Label Preview</p>
                        <p className="mt-2 text-sm font-medium text-[#232f3e]">{resolved.label || "Select a target"}</p>
                      </div>
                      <div className="rounded border border-gray-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">URL Preview</p>
                        <p className="mt-2 text-sm font-medium text-[#232f3e] break-all">{resolved.href || "Generated automatically after selection"}</p>
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