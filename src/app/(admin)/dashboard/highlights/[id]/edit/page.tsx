import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/server/prisma-client";
import { HighlightEditorForm } from "@/components/admin/HighlightEditorForm";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


export default async function EditHighlightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const highlight = await prisma.highlight.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!highlight) {
    notFound();
  }

  const initialData = {
    ...highlight,
    categoryName: highlight.category?.name ?? "General",
    tags: highlight.tags.map((t) => t.tag.name),
  };

  return <HighlightEditorForm initialData={initialData} isNew={false} />;
}
