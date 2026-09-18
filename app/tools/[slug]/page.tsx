import { notFound } from "next/navigation";
import { ToolShell } from "@/components/tools/ToolShell";
import { getToolBySlug, getAllToolSlugs } from "@/lib/tools/registry";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllToolSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: "Tool not found" };
  return {
    title: `${tool.title} · Tools · Nicekit`,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  return <ToolShell tool={tool} />;
}
