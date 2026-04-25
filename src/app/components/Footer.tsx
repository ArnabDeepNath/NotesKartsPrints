"use client";

import Link from "next/link";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Track My Order", href: "/user/orders" },
  { label: "Affiliate Program", href: "#" },
  { label: "NEET PG Full Notes", href: "/books?category=neet-pg" },
  { label: "Rapid Revision Notes", href: "/books?category=rapid-revision" },
  { label: "Other Notes", href: "/books?category=other" },
  { label: "Super Speciality Notes", href: "/books?category=super-speciality" },
];

const POLICIES = [
  { label: "Terms & Conditions", href: "#" },
  { label: "Shipping Policy", href: "#" },
  { label: "Cancellation Policy", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Payment Terms", href: "#" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#232f3e] text-white">
      {/* Track Order Banner */}
      <div className="bg-[#37475a] py-6 px-4 text-center border-b border-[#485769]">
        <h3 className="text-lg font-bold mb-1">Track My Order</h3>
        <p className="text-sm text-gray-300 mb-3">
          To track your order status, please visit the delivery website and enter your tracking number or phone below.
        </p>
        <Link href="/user/orders">
          <button className="bg-[#e47911] hover:bg-[#c45500] text-white font-bold px-8 py-2.5 rounded-md transition-colors text-sm">
            Track Now →
          </button>
        </Link>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #e47911 0%, #f5a623 100%)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              </div>
              <span className="font-black text-xl text-white">NoteKart Prints</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              Need Assistance or Special Requests? Reach out to our support team at <strong className="text-white">+91-877-239-2418</strong>
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Notes: Printing Only on Demand. You will receive a tracking ID as soon as your order is dispatched.
            </p>
            <p className="text-xs text-gray-400 leading-relaxed mt-2">
              Delivery typically takes 4–7 days after Dispatch.
            </p>
            <p className="text-xs text-gray-400 mt-2 font-semibold text-[#f5a623]">
              Note: Orders cannot be cancelled or refunded once purchased.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>
                    <span className="text-sm text-gray-300 hover:text-[#f5a623] transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Policies</h4>
            <ul className="space-y-2">
              {POLICIES.map((p) => (
                <li key={p.label}>
                  <a href={p.href} className="text-sm text-gray-300 hover:text-[#f5a623] transition-colors">
                    {p.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* COD Refund Policy */}
            <div className="mt-5 p-3 bg-[#37475a] rounded-lg border border-[#485769]">
              <h5 className="text-xs font-bold text-white mb-2">COD Refund Policy</h5>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                For COD orders, a 40% advance is required. This advance is non-refundable. COD orders cannot be modified.
              </p>
              <p className="text-[10px] text-[#f5a623] mt-1 font-semibold">
                Discount codes cannot be used with COD purchases.
              </p>
            </div>
          </div>

          {/* Subscribe + Contact */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Stay Connected</h4>
            <div className="flex gap-3 mb-4">
              {["facebook", "twitter", "instagram", "linkedin"].map((social) => (
                <a
                  key={social}
                  href="#"
                  aria-label={social}
                  className="w-8 h-8 bg-[#37475a] rounded-full flex items-center justify-center hover:bg-[#e47911] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {social === "facebook" && <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>}
                    {social === "twitter" && <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>}
                    {social === "instagram" && <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>}
                    {social === "linkedin" && <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></>}
                  </svg>
                </a>
              ))}
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">Subscribe to our emails</p>
              <div className="flex rounded-md overflow-hidden border border-[#485769]">
                <input
                  type="email"
                  placeholder="Email"
                  className="flex-1 bg-[#37475a] text-white placeholder-gray-500 text-xs px-3 py-2 outline-none"
                />
                <button className="bg-[#e47911] hover:bg-[#c45500] px-3 text-white text-xs font-bold transition-colors">
                  →
                </button>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-400 space-y-1">
              <p>📞 +91-9643239402</p>
              <p>🕐 Mon–Sat 10AM–6PM</p>
              <p>📧 print@notekart.in</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#37475a] py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {year} NoteKart Prints. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>
          <p className="text-[#f5a623]">Printing Only on Demand – Quality Guaranteed</p>
        </div>
      </div>
    </footer>
  );
}
