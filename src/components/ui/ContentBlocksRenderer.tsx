import React from "react";
import Image from "next/image";
import type { ContentBlock } from "@/types/portfolio";

export function ContentBlocksRenderer({
  blocks,
}: {
  blocks: ContentBlock[];
}) {
  return (
    <div className="space-y-6 text-base leading-relaxed text-[var(--text-secondary)]">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "heading": {
            if (block.level === 2) {
              return (
                <h2
                  key={key}
                  className="font-heading text-2xl font-semibold tracking-tight text-[var(--text-primary)] pt-4"
                >
                  {block.text}
                </h2>
              );
            }
            return (
              <h3
                key={key}
                className="font-heading text-xl font-semibold tracking-tight text-[var(--text-primary)] pt-2"
              >
                {block.text}
              </h3>
            );
          }
          case "paragraph":
            return (
              <p key={key} className="leading-7 text-[var(--text-secondary)]">
                {block.text}
              </p>
            );
          case "list": {
            const ListTag = block.style === "ordered" ? "ol" : "ul";
            const listClass =
              block.style === "ordered"
                ? "list-decimal pl-6 space-y-2"
                : "list-disc pl-6 space-y-2";
            return (
              <ListTag key={key} className={listClass}>
                {block.items.map((item, i) => (
                  <li key={i} className="leading-7 text-[var(--text-secondary)]">
                    {item}
                  </li>
                ))}
              </ListTag>
            );
          }
          case "quote":
            return (
              <blockquote
                key={key}
                className="border-l-4 border-[var(--accent)] bg-[var(--bg-subtle)] px-6 py-4 italic text-[var(--text-primary)]"
                style={{ borderRadius: "0 var(--radius-md) var(--radius-md) 0" }}
              >
                <p className="text-base leading-relaxed">
                  &ldquo;{block.text}&rdquo;
                </p>
                {block.attribution && (
                  <footer className="mt-2 text-sm not-italic text-[var(--text-muted)]">
                    — {block.attribution}
                  </footer>
                )}
              </blockquote>
            );
          case "image":
            return (
              <figure key={key} className="my-6 space-y-2">
                <div
                  className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                  style={{ borderRadius: "var(--radius-lg)" }}
                >
                  <Image
                    src={block.src}
                    alt={block.alt}
                    width={block.width ?? 800}
                    height={block.height ?? 500}
                    className="w-full h-auto object-cover"
                  />
                </div>
                {block.caption && (
                  <figcaption className="text-sm text-[var(--text-muted)]">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
