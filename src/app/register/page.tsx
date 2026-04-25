"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toaster";
import Button from "@/app/components/ui/Button";

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: "8+ characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase" },
  { test: (p: string) => /[a-z]/.test(p), label: "One lowercase" },
  { test: (p: string) => /\d/.test(p), label: "One number" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast("Account created! Welcome to Basak Library.", "success");
      router.push("/user/dashboard");
    } catch (err: any) {
      toast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center px-4 relative py-12">
      <div className="absolute top-0 left-0 right-0 h-2 bg-[#e47911]" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#e47911] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              </div>
              <span className="font-bold text-[#232f3e] text-lg">NoteKart Prints</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-[#232f3e] mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm">Join thousands of students on NoteKart</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Full Name</label>
              <input type="text" value={form.name} onChange={set("name")} required placeholder="Your name"
                className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#e47911] transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Email</label>
              <input type="email" value={form.email} onChange={set("email")} required placeholder="you@example.com"
                className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#e47911] transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} required placeholder="Min 8 characters"
                  className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#e47911] transition-all pr-10" />
                <button type="button" onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {PASSWORD_RULES.map((rule) => (
                    <span key={rule.label}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        rule.test(form.password) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                      }`}>
                      {rule.test(form.password) ? "✓" : "○"} {rule.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              Create Account
            </Button>
          </form>

          <p className="mt-4 text-[10px] text-gray-400 text-center">
            By creating an account, you agree to our{" "}
            <span className="text-[#146eb4]">Terms of Service</span> and{" "}
            <span className="text-[#146eb4]">Privacy Policy</span>.
          </p>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-[#146eb4] hover:underline font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
