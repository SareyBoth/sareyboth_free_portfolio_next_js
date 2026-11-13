import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/server/prisma-client";
import { ArticleEditorForm } from "@/components/admin/ArticleEditorForm";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const article = await prisma.article.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      tags: { include: { tag: true } },
    },
  });

  if (!article) {
    notFound();
  }

  const initialData = {
    ...article,
    tags: article.tags.map((t) => t.tag.name),
  };

  return <ArticleEditorForm initialData={initialData} isNew={false} />;
}
