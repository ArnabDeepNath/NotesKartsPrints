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
  const [categories, setCategories] = useState<any[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

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
    categoryId: "",
    subcategoryId: "",
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
    // Fetch Categories
    api.categories.getAll().then((res: any) => {
      setCategories(res || []);
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

  const handleAddVariation = () => {
    setVariations(prev => [
      ...prev,
      { id: Date.now(), attributes: { type: "Format", value: "Paperback" }, price: "", comparePrice: "", stock: "10", sku: "", image: null, _file: null }
    ]);
  };

  const handleRemoveVariation = (idx: number) => {
    setVariations(prev => prev.filter((_, i) => i !== idx));
  };

  const handleVariationChange = (idx: number, field: string, value: any) => {
    setVariations(prev => {
      const next = [...prev];
      if (field === "attrType") {
        next[idx].attributes.type = value;
      } else if (field === "attrValue") {
        next[idx].attributes.value = value;
      } else {
        next[idx][field] = value;
      }
      return next;
    });
  };

  const handleVariationImage = async (idx: number, file: File) => {
    try {
      const uploadData = new FormData();
      uploadData.append("image", file);
      const uploadRes: any = await api.upload.image(uploadData);
      
      setVariations(prev => {
        const next = [...prev];
        next[idx].image = uploadRes.url;
        return next;
      });
      toast("Variation image uploaded", "success");
    } catch (err: any) {
      toast("Image upload failed", "error");
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setIsUploadingCover(true);
      const uploadData = new FormData();
      uploadData.append("image", file);
      const uploadRes: any = await api.upload.image(uploadData);
      
      setFormData(prev => ({ ...prev, coverImage: uploadRes.url }));
      toast("Cover image uploaded", "success");
    } catch (err: any) {
      toast("Image upload failed", "error");
    } finally {
      setIsUploadingCover(false);
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
        variations: variations.length > 0 ? variations : undefined,
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
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/admin">
          <button className="text-gray-500 hover:text-[#232f3e] transition-colors text-sm font-medium mb-8 flex items-center gap-2">
            ← Back to Dashboard
          </button>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 rounded-md p-8">
          <h1 className="text-3xl font-bold text-[#232f3e] mb-2">Add New Book</h1>
          <p className="text-gray-500 text-sm mb-8">Enter the details to add a new book to the inventory.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange}
                  className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:border-[#e47911]" required />
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Author *</label>
                <input type="text" name="author" value={formData.author} onChange={handleChange}
                  className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:border-[#e47911]" required />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Price (Rs.) *</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01"
                  className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:border-[#e47911]" required />
              </div>

              {/* Compare Price */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Original Price (Rs.) - Optional</label>
                <input type="number" name="comparePrice" value={formData.comparePrice} onChange={handleChange} min="0" step="0.01"
                  className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:border-[#e47911]" />
              </div>

              {/* Genre, Category, Subcategory */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Primary Genre (Legacy)</label>
                  <select name="genreId" value={formData.genreId} onChange={handleChange}
                    className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:border-[#e47911] appearance-none">
                    <option value="">None</option>
                    {genres.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select name="categoryId" value={formData.categoryId}
                    onChange={(e) => { setFormData(prev => ({ ...prev, categoryId: e.target.value, subcategoryId: "" })); }}
                    className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:border-[#e47911] appearance-none">
                    <option value="">None</option>
                    {categories.filter(c => !c.parentId).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                {formData.categoryId && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subcategory</label>
                    <select name="subcategoryId" value={formData.subcategoryId} onChange={handleChange}
                      className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:border-[#e47911] appearance-none">
                      <option value="">None</option>
                      {categories.find(c => c.id === formData.categoryId)?.children?.map((sub: any) => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* ISBN/Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ISBN</label>
                  <input type="text" name="isbn" value={formData.isbn} onChange={handleChange}
                    className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:border-[#e47911]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Stock</label>
                  <input type="number" name="stock" value={formData.stock} onChange={handleChange} min="0"
                    className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:border-[#e47911]" required />
                </div>
              </div>
            </div>

            {/* Cover Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cover Image *</label>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <input type="text" name="coverImage" value={formData.coverImage} onChange={handleChange}
                    placeholder="Image URL or upload..."
                    className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:border-[#e47911]" required />
                </div>
                <div className="flex-shrink-0">
                   <div className="relative overflow-hidden inline-block border border-gray-300 bg-white hover:bg-gray-50 rounded px-4 py-3 text-sm text-gray-700 font-medium cursor-pointer transition-colors">
                     {isUploadingCover ? "Uploading..." : "Upload File"}
                     <input type="file" accept="image/*" disabled={isUploadingCover} onChange={handleCoverImageUpload}
                       className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                   </div>
                </div>
              </div>
              {formData.coverImage && (
                <div className="mt-4 p-2 border border-gray-200 rounded inline-block">
                  <img src={formData.coverImage} className="h-32 object-contain rounded" alt="Cover Preview" />
                </div>
              )}
            </div>

            {/* Short Desc */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Short Description</label>
              <input type="text" name="shortDesc" value={formData.shortDesc} onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:border-[#e47911]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={5}
                className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 focus:outline-none focus:border-[#e47911]" required />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-[#e47911]" />
              <span className="text-[#232f3e] text-sm font-medium">Feature this book on the home page</span>
            </label>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#232f3e]">Product Variations</h3>
                <button type="button" onClick={handleAddVariation}
                  className="bg-gray-100 hover:bg-gray-200 text-[#232f3e] px-4 py-2 rounded text-sm font-medium transition-colors">+ Add Variation</button>
              </div>
              <p className="text-gray-500 text-sm mb-4">Add variations like Hardcover, Signed Edition, etc. to override base pricing.</p>

              {variations.length === 0 && (
                <div className="text-center py-4 bg-gray-50 border border-gray-200 rounded text-sm text-gray-500">
                  No variations added. Will use base price and stock.
                </div>
              )}

              <div className="space-y-4">
                {variations.map((v, idx) => (
                  <div key={v.id} className="p-5 bg-gray-50 border border-gray-200 rounded-md relative group">
                    <button type="button" onClick={() => handleRemoveVariation(idx)} className="absolute top-4 right-4 text-red-500 hover:underline text-xs">Remove</button>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Attr Name (e.g. Format)</label>
                        <input type="text" value={v.attributes.type} onChange={(e) => handleVariationChange(idx, "attrType", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#e47911]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Attr Value (e.g. Hardcover)</label>
                        <input type="text" value={v.attributes.value} onChange={(e) => handleVariationChange(idx, "attrValue", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#e47911]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Price</label>
                        <input type="number" value={v.price} step="0.01" onChange={(e) => handleVariationChange(idx, "price", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#e47911]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Stock</label>
                        <input type="number" value={v.stock} onChange={(e) => handleVariationChange(idx, "stock", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#e47911]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Specific Image</label>
                      <div className="flex items-center gap-4">
                        <input type="file" accept="image/*"
                          onChange={(e) => { if (e.target.files && e.target.files[0]) handleVariationImage(idx, e.target.files[0]); }}
                          className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
                        {v.image && (<img src={v.image} alt="preview" className="w-10 h-10 object-cover rounded border border-gray-200" />)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full py-4 bg-[#e47911] hover:bg-[#c45500] text-white rounded font-semibold transition-colors disabled:opacity-50">
              {isSubmitting ? "Creating..." : "Save Book to Inventory"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
