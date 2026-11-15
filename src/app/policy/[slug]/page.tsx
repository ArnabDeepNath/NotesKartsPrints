import { notFound } from "next/navigation";
import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/Navbar";
import { DEFAULT_SITE_SETTINGS, type PolicyPage } from "@/lib/site-settings";
import { formatPolicyContent } from "@/lib/policy-content";
import RichTextContent from "@/app/components/RichTextContent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const canonicalPolicySlug = (slug: string) =>
  ["terms-and-conditions", "terms-condition", "terms"].includes(slug)
    ? "terms-conditions"
    : slug;

function findPolicyPage(pages: PolicyPage[], slug: string) {
  const canonicalSlug = canonicalPolicySlug(slug);
  return pages.find((page) => page.slug === canonicalSlug);
}

async function fetchPublicSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const data = await fetchPublicSettings();
  const pages = data?.settings?.policyPages || DEFAULT_SITE_SETTINGS.policyPages;
  return pages.map((page: PolicyPage) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchPublicSettings();
  const pages = data?.settings?.policyPages || DEFAULT_SITE_SETTINGS.policyPages;
  const page = findPolicyPage(pages, slug);
  return {
    title: page?.label || "Policy Page",
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchPublicSettings();
  const pages = data?.settings?.policyPages || DEFAULT_SITE_SETTINGS.policyPages;
  const page = findPolicyPage(pages, slug);

  if (!page) {
    notFound();
  }

  const defaultPage = DEFAULT_SITE_SETTINGS.policyPages.find(
    (defaultPolicy) => defaultPolicy.slug === page.slug,
  );
  const content = formatPolicyContent(page.content, defaultPage?.content);

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e47911]">
              Legal & Policies
            </p>
            <h1 className="text-3xl font-bold leading-tight text-[#232f3e] sm:text-4xl">
              {page.label}
            </h1>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
          <article className="rounded-lg border border-gray-200 bg-white px-5 py-7 shadow-sm sm:px-10 sm:py-10">
            <RichTextContent content={content} className="rich-text-content" />
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
