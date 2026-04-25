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
    printType: "LAZER",
    paperType: "70_GSM",
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
        printType: currOptions.printType,
        paperType: currOptions.paperType,
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
        printType: options.printType,
        paperType: options.paperType,
      });
      
      addToPrintCart(res.job);
      toast("Added to Cart!", "success");
      setFile(null);
      setFileData(null);
      setOptions({ colorMode: "BW", binding: "NONE", paperSize: "A4", printType: "LAZER", paperType: "70_GSM", copies: 1 });
      setPrice(0);
    } catch (err: any) {
      toast(err.message || "Failed to add to cart", "error");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#232f3e]">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-10 pb-10 px-6 bg-[#232f3e]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block py-1 px-3 rounded-full bg-[#e47911]/20 text-[#e47911] text-xs font-semibold tracking-wider mb-4 border border-[#e47911]/30">
              NEW SERVICE
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 mt-3 leading-tight text-white">
              Premium <span className="text-[#e47911]">On-Demand</span> Document Printing.
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-6 leading-relaxed font-light">
              Upload your notes, theses, or corporate documents. We print them with pristine quality and deliver them straight to your door.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Upload and Config Section */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Left: Uploader */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="bg-white border border-gray-200 rounded-md p-8 h-full flex flex-col shadow-sm">
                <h2 className="text-2xl font-semibold text-[#232f3e] mb-6">Upload Document</h2>
                
                <div className="flex-1 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center p-12 text-center relative hover:bg-gray-50 transition-colors group">
                  <input type="file" accept="application/pdf" onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isUploading} />
                  
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-[#e47911] border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-gray-500 font-medium">Uploading & Analyzing...</p>
                    </div>
                  ) : file ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-[#e47911]/10 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-[#e47911]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-[#232f3e] mb-2">{file.name}</p>
                      {fileData && <p className="text-green-600 text-sm font-medium">{fileData.pages} Pages Detected</p>}
                      <p className="text-xs text-gray-400 mt-4">Click to change file</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="font-semibold text-[#232f3e] mb-2">Drag & drop or click to upload</p>
                      <p className="text-gray-400 text-sm">Supported formats: PDF (Max 50MB)</p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right: Settings and Pricing */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
              <div className="bg-white border border-gray-200 rounded-md p-8 h-full flex flex-col shadow-sm">
                <h2 className="text-2xl font-semibold text-[#232f3e] mb-6">Print Settings</h2>
                
                <div className="space-y-6 flex-1">
                  {/* Color Mode */}
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-3">Color Mode</label>
                    <div className="flex gap-4">
                      <button onClick={() => handleOptionChange("colorMode", "BW")}
                        className={`flex-1 py-3 px-4 rounded border text-sm font-semibold transition-all ${
                          options.colorMode === "BW" ? "border-[#e47911] bg-[#e47911]/10 text-[#e47911]" : "border-gray-300 text-gray-600 hover:border-[#e47911]"
                        }`}>
                        Black & White
                      </button>
                      <button onClick={() => handleOptionChange("colorMode", "COLOR")}
                        className={`flex-1 py-3 px-4 rounded border text-sm font-semibold transition-all ${
                          options.colorMode === "COLOR" ? "border-[#e47911] bg-[#e47911]/10 text-[#e47911]" : "border-gray-300 text-gray-600 hover:border-[#e47911]"
                        }`}>
                        Full Color
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-3">Print Type</label>
                      <select value={options.printType} onChange={(e) => handleOptionChange("printType", e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-[#e47911] appearance-none">
                        <option value="LAZER">Lazer Print</option>
                        <option value="INKTANK">Inktank Print</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-3">Paper Type</label>
                      <select value={options.paperType} onChange={(e) => handleOptionChange("paperType", e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-[#e47911] appearance-none">
                        <option value="70_GSM">70 gsm</option>
                        <option value="75_GSM">75 gsm</option>
                        <option value="80_GSM">80 gsm</option>
                        <option value="100_GSM">100 gsm</option>
                        <option value="120_GSM">120 gsm</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-3">Paper Size</label>
                      <select value={options.paperSize} onChange={(e) => handleOptionChange("paperSize", e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-[#e47911] appearance-none">
                        <option value="A4">A4 (Standard)</option>
                        <option value="A5">A5 (Half Size)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-3">Copies</label>
                      <input type="number" min="1" max="100" value={options.copies}
                        onChange={(e) => handleOptionChange("copies", parseInt(e.target.value) || 1)}
                        className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-[#e47911]" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-3">Binding Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "NONE", label: "No Binding (Loose)" },
                        { id: "SPIRAL", label: "Spiral Binding" },
                        { id: "SOFTBOUND", label: "Perfect Softbound" },
                        { id: "HARDBOUND", label: "Premium Hardbound" }
                      ].map(b => (
                        <button key={b.id} onClick={() => handleOptionChange("binding", b.id)}
                          className={`py-3 px-4 rounded border text-sm font-semibold transition-all text-left ${
                            options.binding === b.id ? "border-[#e47911] bg-[#e47911]/10 text-[#e47911]" : "border-gray-300 text-gray-600 hover:border-[#e47911]"
                          }`}>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Estimated Total</p>
                      {isCalculating ? (
                        <div className="h-10 flex items-center">
                          <div className="w-5 h-5 border-2 border-[#e47911] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <p className="text-4xl font-bold text-[#232f3e]">Rs. {price.toLocaleString("en-IN")}</p>
                      )}
                    </div>
                    {fileData && <p className="text-gray-400 text-xs text-right">Based on {fileData.pages} pages</p>}
                  </div>
                  
                  <button disabled={!fileData || isAdding || isCalculating} onClick={handleAddToCart}
                    className="w-full bg-[#e47911] hover:bg-[#c45500] disabled:opacity-50 text-white font-semibold py-4 rounded transition-colors flex justify-center items-center gap-2">
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
