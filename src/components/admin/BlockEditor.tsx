"use client";

import React, { useState } from "react";
import type { ContentBlock } from "@/types/portfolio";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  Heading2,
  Heading3,
  List,
  Quote,
  Image as ImageIcon,
  GripVertical,
} from "lucide-react";
import { MediaPicker, SelectedMedia } from "./MediaPicker";

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [mediaPickerIndex, setMediaPickerIndex] = useState<number | null>(null);

  function addBlock(type: ContentBlock["type"]) {
    let newBlock: ContentBlock;
    switch (type) {
      case "paragraph":
        newBlock = { type: "paragraph", text: "" };
        break;
      case "heading":
        newBlock = { type: "heading", level: 2, text: "" };
        break;
      case "list":
        newBlock = { type: "list", style: "unordered", items: [""] };
        break;
      case "quote":
        newBlock = { type: "quote", text: "", attribution: "" };
        break;
      case "image":
        newBlock = { type: "image", src: "", alt: "", caption: "" };
        break;
    }
    onChange([...blocks, newBlock]);
  }

  function updateBlock(index: number, updated: ContentBlock) {
    const next = [...blocks];
    next[index] = updated;
    onChange(next);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const next = [...blocks];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-[var(--text)]">
          Content Blocks ({blocks.length})
        </label>
        <span className="text-xs text-[var(--muted)]">
          Construct structured, accessible narrative content
        </span>
      </div>

      {blocks.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-lg p-8 text-center bg-[var(--muted)]/5">
          <p className="text-sm text-[var(--muted)]">No content blocks yet.</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Add paragraphs, headings, lists, quotes, or images to build your article.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, idx) => (
            <div
              key={idx}
              className="border border-[var(--border)] rounded-lg bg-[var(--surface)] p-4 shadow-xs space-y-3 group"
            >
              {/* Block Header Toolbar */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] text-xs">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-[var(--muted)] opacity-50" />
                  <span className="font-semibold text-[var(--text)] uppercase tracking-wider text-[11px]">
                    {block.type === "heading"
                      ? `Heading ${block.level}`
                      : block.type}
                  </span>
                  <span className="text-[var(--muted)] text-[11px]">
                    #{idx + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveBlock(idx, "up")}
                    disabled={idx === 0}
                    aria-label="Move block up"
                    className="p-1 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--muted)]/10 disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(idx, "down")}
                    disabled={idx === blocks.length - 1}
                    aria-label="Move block down"
                    className="p-1 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--muted)]/10 disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(idx)}
                    aria-label="Delete block"
                    className="p-1 rounded text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Block Body Inputs */}
              {block.type === "paragraph" && (
                <div>
                  <textarea
                    rows={3}
                    value={block.text}
                    onChange={(e) =>
                      updateBlock(idx, { ...block, text: e.target.value })
                    }
                    placeholder="Enter paragraph text..."
                    className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
              )}

              {block.type === "heading" && (
                <div className="flex items-center gap-3">
                  <select
                    value={block.level}
                    onChange={(e) =>
                      updateBlock(idx, {
                        ...block,
                        level: Number(e.target.value) as 2 | 3,
                      })
                    }
                    className="px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] font-semibold shrink-0"
                  >
                    <option value={2}>H2</option>
                    <option value={3}>H3</option>
                  </select>
                  <input
                    type="text"
                    value={block.text}
                    onChange={(e) =>
                      updateBlock(idx, { ...block, text: e.target.value })
                    }
                    placeholder={`Heading ${block.level} text...`}
                    className="flex-1 px-3 py-1.5 text-sm font-semibold bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
              )}

              {block.type === "list" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-[var(--muted)]">Style:</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(idx, { ...block, style: "unordered" })
                      }
                      className={`px-2 py-0.5 text-xs rounded border ${
                        block.style === "unordered"
                          ? "bg-[var(--accent)] text-[var(--accent-contrast)] border-transparent"
                          : "border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      Bullets
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(idx, { ...block, style: "ordered" })
                      }
                      className={`px-2 py-0.5 text-xs rounded border ${
                        block.style === "ordered"
                          ? "bg-[var(--accent)] text-[var(--accent-contrast)] border-transparent"
                          : "border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      Numbered
                    </button>
                  </div>

                  {block.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[var(--muted)] w-4 text-right">
                        {block.style === "ordered" ? `${itemIdx + 1}.` : "•"}
                      </span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const nextItems = [...block.items];
                          nextItems[itemIdx] = e.target.value;
                          updateBlock(idx, { ...block, items: nextItems });
                        }}
                        placeholder={`List item ${itemIdx + 1}...`}
                        className="flex-1 px-2.5 py-1 text-sm bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextItems = block.items.filter(
                            (_, i) => i !== itemIdx
                          );
                          updateBlock(idx, {
                            ...block,
                            items: nextItems.length ? nextItems : [""],
                          });
                        }}
                        disabled={block.items.length <= 1}
                        className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-colors disabled:opacity-20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      updateBlock(idx, {
                        ...block,
                        items: [...block.items, ""],
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline mt-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add list item</span>
                  </button>
                </div>
              )}

              {block.type === "quote" && (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={block.text}
                    onChange={(e) =>
                      updateBlock(idx, { ...block, text: e.target.value })
                    }
                    placeholder="Quotation text..."
                    className="w-full px-3 py-2 text-sm italic bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <input
                    type="text"
                    value={block.attribution || ""}
                    onChange={(e) =>
                      updateBlock(idx, {
                        ...block,
                        attribution: e.target.value || undefined,
                      })
                    }
                    placeholder="Attribution / Author (optional)..."
                    className="w-full px-3 py-1.5 text-xs bg-transparent border border-[var(--border)] rounded-md text-[var(--muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
              )}

              {block.type === "image" && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={block.src}
                          onChange={(e) =>
                            updateBlock(idx, { ...block, src: e.target.value })
                          }
                          placeholder="/images/example.jpg or https://..."
                          className="flex-1 px-3 py-1.5 text-xs font-mono bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
                        />
                        <button
                          type="button"
                          onClick={() => setMediaPickerIndex(idx)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors shrink-0 flex items-center gap-1"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Select Media</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        value={block.alt}
                        onChange={(e) =>
                          updateBlock(idx, { ...block, alt: e.target.value })
                        }
                        placeholder="Image description (alt text for accessibility) *"
                        className="w-full px-3 py-1.5 text-xs bg-transparent border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
                      />

                      <input
                        type="text"
                        value={block.caption || ""}
                        onChange={(e) =>
                          updateBlock(idx, {
                            ...block,
                            caption: e.target.value || undefined,
                          })
                        }
                        placeholder="Caption (optional)..."
                        className="w-full px-3 py-1.5 text-xs bg-transparent border border-[var(--border)] rounded-md text-[var(--muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>

                    {block.src ? (
                      <div className="w-24 h-24 rounded border border-[var(--border)] overflow-hidden bg-[var(--muted)]/10 shrink-0 relative flex items-center justify-center">
                        <img
                          src={block.src}
                          alt={block.alt || "Preview"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Block Selector Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap pt-2">
        <span className="text-xs text-[var(--muted)] font-medium mr-1">
          Insert Block:
        </span>
        <button
          type="button"
          onClick={() => addBlock("paragraph")}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors"
        >
          <Type className="w-3.5 h-3.5" />
          <span>Paragraph</span>
        </button>
        <button
          type="button"
          onClick={() => addBlock("heading")}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors"
        >
          <Heading2 className="w-3.5 h-3.5" />
          <span>Heading</span>
        </button>
        <button
          type="button"
          onClick={() => addBlock("list")}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors"
        >
          <List className="w-3.5 h-3.5" />
          <span>List</span>
        </button>
        <button
          type="button"
          onClick={() => addBlock("quote")}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors"
        >
          <Quote className="w-3.5 h-3.5" />
          <span>Quote</span>
        </button>
        <button
          type="button"
          onClick={() => addBlock("image")}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--muted)]/10 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Image</span>
        </button>
      </div>

      {/* Media Picker Modal if open */}
      {mediaPickerIndex !== null && (
        <MediaPicker
          isOpen={true}
          onClose={() => setMediaPickerIndex(null)}
          onSelect={(selected: SelectedMedia) => {
            const current = blocks[mediaPickerIndex];
            if (current && current.type === "image") {
              updateBlock(mediaPickerIndex, {
                ...current,
                src: selected.src,
                alt: selected.alt || current.alt || "Uploaded image",
                width: selected.width,
                height: selected.height,
              });
            }
          }}
          initialAlt={
            blocks[mediaPickerIndex]?.type === "image"
              ? (blocks[mediaPickerIndex] as any).alt
              : ""
          }
        />
      )}
    </div>
  );
}
