"use client";

import { getImageUrl } from "@/lib/api";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export default function SiteLogo({ footer = false }: { footer?: boolean }) {
  const { settings } = useSiteSettings();
  const { header } = settings;
  const brandName = footer ? settings.footer.brandName : header.brandName;

  return (
    <div className="flex min-w-0 items-center gap-2">
      {header.logo ? (
        <img
          src={getImageUrl(header.logo)}
          alt={`${brandName} logo`}
          className="h-10 w-auto max-w-28 shrink-0 object-contain sm:h-11 sm:max-w-36"
        />
      ) : (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: "linear-gradient(135deg, #e47911 0%, #f5a623 100%)",
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
            aria-hidden="true"
          >
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
        </div>
      )}
      {footer ? (
        <span className="truncate text-xl font-black text-white">{brandName}</span>
      ) : (
        <div className="min-w-0">
          <span className="block truncate text-lg font-black leading-none tracking-tight text-[#232f3e] sm:text-xl">
            {brandName}
          </span>
          <span className="text-[10px] font-semibold uppercase leading-none tracking-widest text-[#e47911]">
            {header.brandAccent}
          </span>
        </div>
      )}
    </div>
  );
}
