"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useToast } from "@/app/components/ui/Toaster";

export default function UserProfile() {
  const { user, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    bio: "",
  });
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        country: user.country || "",
        bio: user.bio || "",
      });
    }
  }, [user, authLoading, router]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { user: updated } = (await api.users.updateProfile(form)) as any;
      updateUser(updated);
      toast("Profile updated!", "success");
    } catch (err: any) {
      toast(err.message || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) {
      return toast("Passwords do not match", "error");
    }
    setSaving(true);
    try {
      await api.auth.changePassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      toast("Password changed. Please log in again.", "success");
      router.push("/login");
    } catch (err: any) {
      toast(err.message || "Failed to change password", "error");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="pt-24 pb-20 px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Profile Settings
          </h1>
          <p className="text-[#86868b] mt-1">
            Manage your account details and preferences
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/[0.04] rounded-xl p-1 w-fit">
          {(["profile", "password"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? "bg-white/[0.12] text-white" : "text-[#86868b] hover:text-white"}`}
            >
              {t === "profile" ? "Profile" : "Password"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "profile" ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8">
                {/* Avatar */}
                <div className="flex items-center gap-5 mb-8 pb-8 border-b border-white/[0.08]">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#2997ff] to-[#0066cc] flex items-center justify-center text-white text-3xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-[#86868b]">{user.email}</p>
                    <span
                      className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.role === "ADMIN" ? "bg-[#f5a623]/15 text-[#f5a623]" : "bg-[#2997ff]/15 text-[#2997ff]"}`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={handleProfileSave}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  <Field
                    label="Full Name"
                    value={form.name}
                    onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                    required
                  />
                  <Field
                    label="Phone"
                    value={form.phone}
                    onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                    type="tel"
                  />
                  <Field
                    label="City"
                    value={form.city}
                    onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                  />
                  <Field
                    label="Country"
                    value={form.country}
                    onChange={(v) => setForm((f) => ({ ...f, country: v }))}
                  />
                  <div className="md:col-span-2">
                    <Field
                      label="Address"
                      value={form.address}
                      onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider mb-2 block">
                      Bio
                    </label>
                    <textarea
                      value={form.bio}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, bio: e.target.value }))
                      }
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-[#48484a] text-sm focus:outline-none focus:border-[#2997ff]/60 resize-none"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#2997ff] hover:bg-[#1a83ff] text-white text-sm font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8">
                <h3 className="text-lg font-semibold text-white mb-6">
                  Change Password
                </h3>
                <form
                  onSubmit={handlePasswordChange}
                  className="flex flex-col gap-5"
                >
                  <Field
                    label="Current Password"
                    value={passForm.currentPassword}
                    onChange={(v) =>
                      setPassForm((f) => ({ ...f, currentPassword: v }))
                    }
                    type="password"
                    required
                  />
                  <Field
                    label="New Password"
                    value={passForm.newPassword}
                    onChange={(v) =>
                      setPassForm((f) => ({ ...f, newPassword: v }))
                    }
                    type="password"
                    required
                  />
                  <Field
                    label="Confirm New Password"
                    value={passForm.confirm}
                    onChange={(v) => setPassForm((f) => ({ ...f, confirm: v }))}
                    type="password"
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#2997ff] hover:bg-[#1a83ff] text-white text-sm font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {saving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider mb-2 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-[#48484a] text-sm focus:outline-none focus:border-[#2997ff]/60 transition-all"
      />
    </div>
  );
}
