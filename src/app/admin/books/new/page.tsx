"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, Genre } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toaster";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NewBookPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [genres, setGenres] = useState<Genre[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    shortDesc: "",
    price: "",
    comparePrice: "",
    isbn: "",
    publisher: "",
    pages: "",
    stock: "10",
    genreId: "",
    coverImage: "",
    featured: false,
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Fetch genres
    api.books.genres().then((res) => {
      setGenres(res.genres || []);
      if (res.genres?.length) {
        setFormData(prev => ({ ...prev, genreId: res.genres[0].id }));
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author || !formData.price || !formData.description) {
      toast("Please fill in all required fields", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.books.create({
        ...formData,
        price: Number(formData.price),
        comparePrice: formData.comparePrice ? Number(formData.comparePrice) : undefined,
        pages: formData.pages ? Number(formData.pages) : undefined,
        stock: Number(formData.stock),
      });

      toast("Book added successfully!", "success");
      router.push("/admin");
    } catch (err: any) {
      toast(err.message || "Failed to create book", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || user.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/admin">
          <button className="text-[#86868b] hover:text-white transition-colors text-sm font-medium mb-8 flex items-center gap-2">
            ← Back to Dashboard
          </button>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/[0.05] rounded-3xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Add New Book</h1>
          <p className="text-[#86868b] text-sm mb-8">Enter the details to add a new book to the inventory.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2997ff]"
                  required
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Author *</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2997ff]"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2997ff]"
                  required
                />
              </div>

              {/* Compare Price */}
              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Original Price (₹) - Optional</label>
                <input
                  type="number"
                  name="comparePrice"
                  value={formData.comparePrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2997ff]"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Genre</label>
                <select
                  name="genreId"
                  value={formData.genreId}
                  onChange={handleChange}
                  className="w-full bg-[#1c1c1e] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2997ff] appearance-none"
                >
                  {genres.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* ISBN/Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">ISBN</label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2997ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2997ff]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Cover Image URL */}
            <div>
              <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Cover Image URL</label>
              <input
                type="url"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleChange}
                placeholder="https://example.com/cover.jpg"
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2997ff]"
              />
            </div>

            {/* Short Desc */}
            <div>
              <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Short Description</label>
              <input
                type="text"
                name="shortDesc"
                value={formData.shortDesc}
                onChange={handleChange}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2997ff]"
              />
            </div>

            {/* Full Desc */}
            <div>
              <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Full Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2997ff]"
                required
              />
            </div>

            {/* Featured Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-5 h-5 rounded bg-white/[0.1] border-white/[0.2] text-[#2997ff] focus:ring-[#2997ff]"
              />
              <span className="text-white text-sm font-medium">Feature this book on the home page</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#2997ff] hover:bg-[#1a83ff] text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Save Book to Inventory"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
