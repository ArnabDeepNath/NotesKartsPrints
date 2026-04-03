"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useToast } from "@/app/components/ui/Toaster";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  children?: Category[];
  books?: any[];
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const data: any = await api.categories.getAll();
      setCategories(data);
    } catch (err: any) {
      toast(err.message || "Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (cat: Category | null = null) => {
    setEditingCat(cat);
    if (cat) {
      setFormData({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        parentId: cat.parentId || "",
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        parentId: "",
      });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = editingCat?.image;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("image", imageFile);
        const uploadRes: any = await api.upload.image(uploadData);
        imageUrl = uploadRes.url;
      }

      const payload = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        parentId: formData.parentId || null,
        image: imageUrl || null
      };

      if (editingCat) {
        await api.categories.update(editingCat.id, payload);
        toast("Category updated gracefully", "success");
      } else {
        await api.categories.create(payload);
        toast("Category created successfully", "success");
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast(err.message || "Failed to save category", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.categories.delete(id);
      toast("Category deleted", "success");
      fetchCategories();
    } catch (err: any) {
      toast(err.message || "Failed to delete category", "error");
    }
  };

  // Build a tree to show parents and children
  const topLevels = categories.filter(c => !c.parentId);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/admin">
          <button className="text-[#86868b] hover:text-white transition-colors text-sm font-medium mb-8 flex items-center gap-2">
            ← Back to Dashboard
          </button>
        </Link>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Categories</h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-[#2997ff] hover:bg-[#1a83ff] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.05] rounded-3xl p-8 mb-8 overflow-hidden">
          {loading ? (
            <div className="text-center text-[#86868b]">Loading categories...</div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {topLevels.length === 0 && (
                <div className="text-center text-[#86868b]">No categories found. Start by creating one.</div>
              )}
              {topLevels.map((cat) => (
                <div key={cat.id} className="py-4 hover:bg-white/[0.02] transition-colors rounded-lg px-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-medium flex items-center gap-2">
                        {cat.name} 
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.1] text-[#86868b]">/{cat.slug}</span>
                      </h3>
                      {cat.description && <p className="text-sm text-[#86868b] mt-1">{cat.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(cat)} className="text-[#2997ff] hover:underline text-sm">Edit</button>
                      <button onClick={() => handleDelete(cat.id)} className="text-[#ff453a] hover:underline text-sm">Delete</button>
                    </div>
                  </div>

                  {/* Subcategories */}
                  {cat.children && cat.children.length > 0 && (
                    <div className="mt-4 pl-6 border-l-2 border-white/[0.05] space-y-3">
                      {cat.children.map(sub => (
                        <div key={sub.id} className="flex justify-between items-center">
                          <div>
                            <span className="text-sm text-white flex items-center gap-2">
                              • {sub.name}
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] text-[#86868b]">/{sub.slug}</span>
                            </span>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <button onClick={() => handleOpenModal(sub)} className="text-[#2997ff] hover:underline">Edit</button>
                            <button onClick={() => handleDelete(sub.id)} className="text-[#ff453a] hover:underline">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1c1c1e] border border-white/[0.1] rounded-2xl w-full max-w-lg overflow-hidden relative z-[51]"
            >
              <div className="p-6 border-b border-white/[0.05] flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">{editingCat ? "Edit Category" : "New Category"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[#86868b] hover:text-white">✕</button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#2c2c2e] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2997ff]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={e => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="Auto-generated if empty"
                      className="w-full bg-[#2c2c2e] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#2997ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Parent Category</label>
                    <select
                      value={formData.parentId}
                      onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                      className="w-full bg-[#2c2c2e] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#2997ff]"
                    >
                      <option value="">None (Top Level)</option>
                      {topLevels.filter(c => c.id !== editingCat?.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#2c2c2e] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#2997ff]"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Category Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                    }}
                    className="w-full text-sm text-[#86868b] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/[0.05] file:text-white hover:file:bg-white/[0.1] cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/[0.1] text-sm text-white font-medium hover:bg-white/[0.05] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#2997ff] text-sm text-white font-medium hover:bg-[#1a83ff] transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Category"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
