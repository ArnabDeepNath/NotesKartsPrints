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
      <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e47911] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar />
      <main className="pt-6 pb-20 px-4 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 pt-4">
          <h1 className="text-3xl font-bold text-[#232f3e]">Profile Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account details and preferences</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {(["profile", "password"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium transition-all capitalize border-b-2 -mb-px ${
                tab === t ? "border-[#e47911] text-[#e47911]" : "border-transparent text-gray-500 hover:text-[#232f3e]"
              }`}>
              {t === "profile" ? "Profile" : "Password"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "profile" ? (
            <motion.div key="profile" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <div className="bg-white border border-gray-200 rounded-md p-8">
                <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-100">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#232f3e] flex items-center justify-center text-white text-3xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#232f3e]">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.role === "ADMIN" ? "bg-[#e47911]/15 text-[#e47911]" : "bg-blue-100 text-blue-700"
                    }`}>{user.role}</span>
                  </div>
                </div>

                <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Full Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
                  <Field label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} type="tel" />
                  <Field label="City" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
                  <Field label="Country" value={form.country} onChange={(v) => setForm((f) => ({ ...f, country: v }))} />
                  <div className="md:col-span-2">
                    <Field label="Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Bio</label>
                    <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#e47911] resize-none" />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button type="submit" disabled={saving}
                      className="bg-[#e47911] hover:bg-[#c45500] text-white text-sm font-semibold px-8 py-3 rounded transition-colors disabled:opacity-50">
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div key="password" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <div className="bg-white border border-gray-200 rounded-md p-8">
                <h3 className="text-lg font-semibold text-[#232f3e] mb-6">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="flex flex-col gap-5">
                  <Field label="Current Password" value={passForm.currentPassword} onChange={(v) => setPassForm((f) => ({ ...f, currentPassword: v }))} type="password" required />
                  <Field label="New Password" value={passForm.newPassword} onChange={(v) => setPassForm((f) => ({ ...f, newPassword: v }))} type="password" required />
                  <Field label="Confirm New Password" value={passForm.confirm} onChange={(v) => setPassForm((f) => ({ ...f, confirm: v }))} type="password" required />
                  <div className="flex justify-end">
                    <button type="submit" disabled={saving}
                      className="bg-[#e47911] hover:bg-[#c45500] text-white text-sm font-semibold px-8 py-3 rounded transition-colors disabled:opacity-50">
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
  label, value, onChange, type = "text", required = false,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full bg-white border border-gray-300 rounded px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-[#e47911] transition-all" />
    </div>
  );
}
