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
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden py-20">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10"
          style={{
            background: "radial-gradient(circle, #2997ff, transparent)",
          }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10"
          style={{
            background: "radial-gradient(circle, #30d158, transparent)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2.5 mb-6">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #2997ff 0%, #0066cc 100%)",
                  boxShadow: "0 0 24px rgba(41,151,255,0.4)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              </div>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Create your account
          </h1>
          <p className="text-[#86868b] text-sm">
            Join thousands of readers on Basak Library
          </p>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider mb-2 block">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                required
                placeholder="Your name"
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-[#48484a] text-sm focus:outline-none focus:border-[#2997ff]/60 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider mb-2 block">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                placeholder="you@example.com"
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-[#48484a] text-sm focus:outline-none focus:border-[#2997ff]/60 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  required
                  placeholder="Min 8 characters"
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-[#48484a] text-sm focus:outline-none focus:border-[#2997ff]/60 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48484a] hover:text-white transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {PASSWORD_RULES.map((rule) => (
                    <span
                      key={rule.label}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${rule.test(form.password) ? "bg-[#30d158]/15 text-[#30d158]" : "bg-white/[0.06] text-[#48484a]"}`}
                    >
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

          <p className="mt-4 text-[10px] text-[#48484a] text-center">
            By creating an account, you agree to our{" "}
            <span className="text-[#2997ff]">Terms of Service</span> and{" "}
            <span className="text-[#2997ff]">Privacy Policy</span>.
          </p>

          <div className="mt-6 pt-6 border-t border-white/[0.08] text-center">
            <p className="text-sm text-[#86868b]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#2997ff] hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
