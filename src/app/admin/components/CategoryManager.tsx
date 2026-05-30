"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/app/components/ui/Toaster";

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  children?: Category[];
};

const normalizeCategoryTree = (items: Category[]) => {
  const byId = new Map<string, Category>();

  const upsert = (item: Category) => {
    const current = byId.get(item.id);
    byId.set(item.id, {
      ...(current || {}),
      ...item,
      children: [],
    });
  };

  items.forEach((item) => {
    upsert(item);
    item.children?.forEach((child) => upsert(child));
  });

  const normalized = Array.from(byId.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  normalized.forEach((item) => {
    item.children = [];
  });

  normalized.forEach((item) => {
    if (!item.parentId) {
      return;
    }

    const parent = byId.get(item.parentId);
    if (parent) {
      parent.children = [...(parent.children || []), item].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
    }
  });

  return normalized.filter((item) => !item.parentId);
};

type CategoryManagerMode = "category" | "subcategory";

export default function CategoryManager({
  mode,
}: {
  mode: CategoryManagerMode;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
  });
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      const data = (await api.categories.getAll()) as Category[];
      setCategories(normalizeCategoryTree(data));
    } catch (error: unknown) {
      toast(getErrorMessage(error, "Failed to load categories"), "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const topLevels = categories;
  const subcategoryGroups = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          children: category.children || [],
        }))
        .filter((category) => category.children.length > 0),
    [categories],
  );

  const openModal = (category: Category | null = null, parentId = "") => {
    setEditingCategory(category);
    setFormData({
      name: category?.name || "",
      description: category?.description || "",
      parentId: category?.parentId || parentId,
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setImageFile(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = editingCategory?.image || null;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("image", imageFile);
        const uploadResponse = await api.upload.image(uploadData);
        imageUrl = uploadResponse.url;
      }

      const payload = {
        name: formData.name,
        slug: slugify(formData.name),
        description: formData.description,
        parentId: mode === "subcategory" ? formData.parentId || null : null,
        image: imageUrl,
      };

      if (editingCategory) {
        await api.categories.update(editingCategory.id, payload);
        toast(
          mode === "subcategory" ? "Subcategory updated" : "Category updated",
          "success",
        );
      } else {
        await api.categories.create(payload);
        toast(
          mode === "subcategory" ? "Subcategory created" : "Category created",
          "success",
        );
      }

      closeModal();
      fetchCategories();
    } catch (error: unknown) {
      toast(getErrorMessage(error, "Failed to save category"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      await api.categories.delete(id);
      toast(
        mode === "subcategory" ? "Subcategory deleted" : "Category deleted",
        "success",
      );
      fetchCategories();
    } catch (error: unknown) {
      toast(getErrorMessage(error, "Failed to delete category"), "error");
    }
  };

  const selectedParent = topLevels.find(
    (category) => category.id === formData.parentId,
  );
  const slugPreview = slugify(formData.name);
  const pageTitle = mode === "subcategory" ? "Subcategories" : "Categories";
  const addButtonLabel =
    mode === "subcategory" ? "Add Subcategory" : "Add Category";

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/admin">
          <button className="text-gray-500 hover:text-[#232f3e] transition-colors text-sm font-medium mb-8 flex items-center gap-2">
            ← Back to Dashboard
          </button>
        </Link>

        <div className="flex justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#232f3e]">{pageTitle}</h1>
            <p className="text-sm text-gray-500 mt-2">
              {mode === "subcategory"
                ? "Create one-level child categories under an existing top-level category."
                : "Create the top-level categories that can be used in books, navbar menus, and homepage boxes."}
            </p>
          </div>
          <button
            onClick={() => openModal(null)}
            className="bg-[#e47911] hover:bg-[#c45500] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {addButtonLabel}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-8 overflow-hidden">
          {loading ? (
            <div className="text-center text-gray-500">
              Loading {pageTitle.toLowerCase()}...
            </div>
          ) : mode === "category" ? (
            <div className="divide-y divide-gray-100">
              {topLevels.length === 0 && (
                <div className="text-center text-gray-500">
                  No categories found. Start by creating one.
                </div>
              )}
              {topLevels.map((category) => (
                <div
                  key={category.id}
                  className="py-4 px-2 hover:bg-gray-50 transition-colors rounded"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[#232f3e] font-medium flex items-center gap-2 flex-wrap">
                        <span>{category.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          /{category.slug}
                        </span>
                        {category.children?.length ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#fff3e0] text-[#c45500]">
                            {category.children.length} subcategories
                          </span>
                        ) : null}
                      </h3>
                      {category.description ? (
                        <p className="text-sm text-gray-500 mt-1">
                          {category.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-3 text-sm">
                      <button
                        onClick={() => openModal(category)}
                        className="text-[#146eb4] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {topLevels.length === 0 && (
                <div className="rounded border border-[#ffe0b2] bg-[#fff8f1] px-4 py-3 text-sm text-[#8a5a15]">
                  Create a top-level category first. Subcategories need a parent
                  category.
                </div>
              )}
              {subcategoryGroups.length === 0 ? (
                <div className="text-center text-gray-500">
                  No subcategories found yet.
                </div>
              ) : (
                subcategoryGroups.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-xl border border-gray-200 p-5"
                  >
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#232f3e]">
                          {category.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          /{category.slug}
                        </p>
                      </div>
                      <button
                        onClick={() => openModal(null, category.id)}
                        className="text-sm font-medium text-[#e47911] hover:underline"
                      >
                        Add Subcategory
                      </button>
                    </div>
                    <div className="space-y-3">
                      {category.children?.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-start justify-between gap-4 rounded border border-gray-100 px-4 py-3 bg-gray-50/70"
                        >
                          <div>
                            <p className="text-sm font-medium text-[#232f3e]">
                              {child.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              /{child.slug}
                            </p>
                            {child.description ? (
                              <p className="text-xs text-gray-500 mt-1">
                                {child.description}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex gap-3 text-xs">
                            <button
                              onClick={() => openModal(child)}
                              className="text-[#146eb4] hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(child.id)}
                              className="text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-gray-200 rounded-md w-full max-w-lg overflow-hidden shadow-xl"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#232f3e]">
                  {editingCategory
                    ? mode === "subcategory"
                      ? "Edit Subcategory"
                      : "Edit Category"
                    : mode === "subcategory"
                      ? "New Subcategory"
                      : "New Category"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-[#232f3e]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <label className="block text-sm font-medium text-[#232f3e]">
                  <span className="block mb-2">Name</span>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-300 px-4 py-3 text-sm text-gray-800"
                  />
                </label>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="block text-sm font-medium text-[#232f3e] mb-2">
                      URL Preview
                    </p>
                    <div className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 text-sm text-gray-700">
                      {slugPreview
                        ? mode === "subcategory"
                          ? `/books?subcategory=${slugPreview}`
                          : `/books?category=${slugPreview}`
                        : "Generated after you type the name"}
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-[#232f3e]">
                    <span className="block mb-2">Parent Category</span>
                    <select
                      value={formData.parentId}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          parentId: event.target.value,
                        }))
                      }
                      disabled={mode === "category"}
                      className="w-full rounded border border-gray-300 px-4 py-3 text-sm text-gray-800 bg-white disabled:bg-gray-100"
                    >
                      <option value="">
                        {mode === "subcategory"
                          ? "Select parent category"
                          : "None (Top-level category)"}
                      </option>
                      {topLevels
                        .filter(
                          (category) => category.id !== editingCategory?.id,
                        )
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                {mode === "subcategory" && selectedParent ? (
                  <div className="rounded border border-[#ffe0b2] bg-[#fff8f1] px-4 py-3 text-sm text-[#8a5a15]">
                    This will appear under{" "}
                    <strong>{selectedParent.name}</strong>.
                  </div>
                ) : null}

                <label className="block text-sm font-medium text-[#232f3e]">
                  <span className="block mb-2">Description</span>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-300 px-4 py-3 text-sm text-gray-800"
                  />
                </label>

                <label className="block text-sm font-medium text-[#232f3e]">
                  <span className="block mb-2">Image (Optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setImageFile(event.target.files?.[0] || null)
                    }
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                  />
                </label>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded border border-gray-300 text-sm text-gray-600 font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      (mode === "subcategory" && !formData.parentId)
                    }
                    className="px-5 py-2.5 rounded bg-[#e47911] text-sm text-white font-medium hover:bg-[#c45500] transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
