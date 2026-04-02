"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, PrintJob } from "@/lib/api";
import { useToast } from "@/app/components/ui/Toaster";
import Navbar from "@/app/components/Navbar";

export default function PrintSaaSPage() {
  const { user, addToPrintCart } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<{ fileUrl: string; pages: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [options, setOptions] = useState({
    colorMode: "BW",
    binding: "NONE",
    paperSize: "A4",
    copies: 1,
  });
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);

  const calculatePrice = async (currOptions = options, currPages?: number) => {
    const p = currPages || (fileData ? fileData.pages : 1);
    setIsCalculating(true);
    try {
      const res = await api.print.calculatePrice({
        pages: p,
        copies: currOptions.copies,
        colorMode: currOptions.colorMode,
        binding: currOptions.binding,
      });
      setPrice(res.price);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    
    if (selectedFile.type !== "application/pdf") {
      toast("Only PDF files are supported currently.", "error");
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("document", selectedFile);

    try {
      if (!user) {
        toast("Please log in to upload documents", "error");
        router.push("/login?redirect=/print");
        return;
      }
      
      const res: any = await api.print.upload(formData);
      setFileData({ fileUrl: res.fileUrl, pages: res.pages });
      calculatePrice(options, res.pages);
      toast("File uploaded successfully! Detected " + res.pages + " pages.", "success");
    } catch (err: any) {
      toast(err.message || "Failed to upload document", "error");
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOptionChange = (key: string, value: any) => {
    const newOptions = { ...options, [key]: value };
    setOptions(newOptions);
    calculatePrice(newOptions);
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push("/login?redirect=/print");
      return;
    }
    if (!fileData) return;

    setIsAdding(true);
    try {
      const res: { job: PrintJob } = await api.print.createJob({
        fileUrl: fileData.fileUrl,
        fileName: file?.name || "Document.pdf",
        pages: fileData.pages,
        copies: options.copies,
        colorMode: options.colorMode,
        binding: options.binding,
        paperSize: options.paperSize,
      });
      
      addToPrintCart(res.job);
      toast("Added to Cart!", "success");
      setFile(null);
      setFileData(null);
      setOptions({ colorMode: "BW", binding: "NONE", paperSize: "A4", copies: 1 });
      setPrice(0);
    } catch (err: any) {
      toast(err.message || "Failed to add to cart", "error");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#2997ff]/30">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#2997ff]/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-[#2997ff]/10 text-[#2997ff] text-xs font-semibold tracking-wider mb-6 border border-[#2997ff]/20">
              NEW SERVICE
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 mt-4 leading-tight">
              Premium <span className="text-[#2997ff]">On-Demand</span> Document Printing.
            </h1>
            <p className="text-[#86868b] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              Upload your notes, theses, or corporate documents. We print them with pristine quality and deliver them straight to your door.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Upload and Config Section */}
      <section className="pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Left: Uploader */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-[#1c1c1e] rounded-3xl p-8 border border-white/[0.05] h-full flex flex-col">
                <h2 className="text-2xl font-semibold mb-6">Upload Document</h2>
                
                <div className="flex-1 border-2 border-dashed border-white/[0.1] rounded-2xl flex flex-col items-center justify-center p-12 text-center relative hover:bg-white/[0.02] transition-colors group">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isUploading}
                  />
                  
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-[#2997ff] border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-[#86868b] font-medium">Uploading & Analyzing...</p>
                    </div>
                  ) : file ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-[#2997ff]/10 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-[#2997ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-white mb-2">{file.name}</p>
                      {fileData && (
                        <p className="text-[#30d158] text-sm font-medium">{fileData.pages} Pages Detected</p>
                      )}
                      <p className="text-xs text-[#86868b] mt-4">Click to change file</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white/[0.05] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-[#86868b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="font-semibold text-white mb-2">Drag & drop or click to upload</p>
                      <p className="text-[#86868b] text-sm">Supported formats: PDF (Max 50MB)</p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right: Settings and Pricing */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="bg-[#1c1c1e] rounded-3xl p-8 border border-white/[0.05] h-full flex flex-col">
                <h2 className="text-2xl font-semibold mb-6">Print Settings</h2>
                
                <div className="space-y-6 flex-1">
                  {/* Color Mode */}
                  <div>
                    <label className="text-sm font-medium text-[#86868b] block mb-3">Color Mode</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleOptionChange("colorMode", "BW")}
                        className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${options.colorMode === "BW" ? "border-[#2997ff] bg-[#2997ff]/10 text-[#2997ff]" : "border-white/[0.1] text-white hover:bg-white/[0.05]"}`}
                      >
                        Black & White
                      </button>
                      <button 
                        onClick={() => handleOptionChange("colorMode", "COLOR")}
                        className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${options.colorMode === "COLOR" ? "border-[#2997ff] bg-[#2997ff]/10 text-[#2997ff]" : "border-white/[0.1] text-white hover:bg-white/[0.05]"}`}
                      >
                        Full Color
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Size */}
                    <div>
                      <label className="text-sm font-medium text-[#86868b] block mb-3">Paper Size</label>
                      <select 
                        value={options.paperSize}
                        onChange={(e) => handleOptionChange("paperSize", e.target.value)}
                        className="w-full bg-[#2c2c2e] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#2997ff]/60 appearance-none"
                      >
                        <option value="A4">A4 (Standard)</option>
                        <option value="A5">A5 (Half Size)</option>
                      </select>
                    </div>

                    {/* Copies */}
                    <div>
                      <label className="text-sm font-medium text-[#86868b] block mb-3">Copies</label>
                      <input 
                        type="number"
                        min="1"
                        max="100"
                        value={options.copies}
                        onChange={(e) => handleOptionChange("copies", parseInt(e.target.value) || 1)}
                        className="w-full bg-[#2c2c2e] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#2997ff]/60"
                      />
                    </div>
                  </div>

                  {/* Binding */}
                  <div>
                    <label className="text-sm font-medium text-[#86868b] block mb-3">Binding Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[ 
                        { id: "NONE", label: "No Binding (Loose)" }, 
                        { id: "SPIRAL", label: "Spiral Binding" }, 
                        { id: "SOFTBOUND", label: "Perfect Softbound" }, 
                        { id: "HARDBOUND", label: "Premium Hardbound" } 
                      ].map(b => (
                        <button 
                          key={b.id}
                          onClick={() => handleOptionChange("binding", b.id)}
                          className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all text-left ${options.binding === b.id ? "border-[#2997ff] bg-[#2997ff]/10 text-[#2997ff]" : "border-white/[0.1] text-white hover:bg-white/[0.05]"}`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/[0.1]">
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="text-[#86868b] text-sm font-medium mb-1">Estimated Total</p>
                      {isCalculating ? (
                        <div className="h-10 flex items-center">
                           <div className="w-5 h-5 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <p className="text-4xl font-bold text-white">₹{price.toLocaleString("en-IN")}</p>
                      )}
                    </div>
                    {fileData && (
                       <p className="text-[#86868b] text-xs text-right">
                         Based on {fileData.pages} pages
                       </p>
                    )}
                  </div>
                  
                  <button 
                    disabled={!fileData || isAdding || isCalculating}
                    onClick={handleAddToCart}
                    className="w-full bg-[#2997ff] hover:bg-[#1a83ff] disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-colors flex justify-center items-center gap-2"
                  >
                    {isAdding ? "Adding to Cart..." : "Add to Cart"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
