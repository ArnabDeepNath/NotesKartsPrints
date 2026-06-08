import { notFound } from "next/navigation";
import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/Navbar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
  const pages = data?.settings?.policyPages || [];
  return pages.map((p: { slug: string }) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchPublicSettings();
  const page = data?.settings?.policyPages?.find(
    (p: { slug: string }) => p.slug === slug,
  );
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
  const page = data?.settings?.policyPages?.find(
    (p: { slug: string }) => p.slug === slug,
  );

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-[#232f3e] mb-6">
          {page.label}
        </h1>
        <div
          className="prose prose-sm max-w-none text-gray-700 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#232f3e] [&_h1]:mt-8 [&_h1]:mb-4
                     [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#232f3e] [&_h2]:mt-6 [&_h2]:mb-3
                     [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#232f3e] [&_h3]:mt-4 [&_h3]:mb-2
                     [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                     [&_a]:text-[#146eb4] [&_a]:underline [&_strong]:text-[#232f3e]"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </main>
      <Footer />
    </div>
  );
}
