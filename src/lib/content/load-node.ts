import fs from "node:fs";
import path from "node:path";
import rawPortfolioJson from "@/content/portfolio.json";
import type { PortfolioConfig } from "@/types/portfolio";
import { isSafeLocalPath, validatePortfolioConfig } from "./schema";

export interface LocalAssetCheck {
  fieldPath: string;
  assetPath: string;
  resolvedFilePath: string;
  exists: boolean;
  isNonEmptyFile: boolean;
}

export function resolvePublicFilePath(
  assetPath: string,
  publicDir?: string
): string {
  const cleanRel = assetPath.replace(/^\/+/, "");
  if (publicDir) {
    return path.join(/*turbopackIgnore: true*/ publicDir, cleanRel);
  }
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "public", cleanRel);
}

export function checkLocalFileExistsAndNonEmpty(
  assetPath: string | undefined,
  publicDir?: string
): boolean {
  if (!assetPath || !assetPath.trim()) {
    return false;
  }
  const trimmed = assetPath.trim();
  if (!isSafeLocalPath(trimmed)) {
    return false;
  }
  try {
    const fullPath = resolvePublicFilePath(trimmed, publicDir);
    const stat = fs.statSync(/*turbopackIgnore: true*/ fullPath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

export function collectReferencedLocalAssets(
  config: PortfolioConfig,
  publicDir?: string
): LocalAssetCheck[] {
  const checks: LocalAssetCheck[] = [];

  const recordIfLocal = (fieldPath: string, maybeUrl?: string) => {
    if (!maybeUrl || !maybeUrl.trim()) return;
    const trimmed = maybeUrl.trim();
    if (!trimmed.startsWith("/")) return;
    const resolvedFilePath = resolvePublicFilePath(trimmed, publicDir);
    let exists = false;
    let isNonEmptyFile = false;
    try {
      const stat = fs.statSync(/*turbopackIgnore: true*/ resolvedFilePath);
      exists = stat.isFile();
      isNonEmptyFile = stat.isFile() && stat.size > 0;
    } catch {
      exists = false;
      isNonEmptyFile = false;
    }
    checks.push({
      fieldPath,
      assetPath: trimmed,
      resolvedFilePath,
      exists,
      isNonEmptyFile,
    });
  };

  recordIfLocal("site.socialImage.src", config.site.socialImage?.src);
  recordIfLocal("profile.portrait.src", config.profile.portrait?.src);
  recordIfLocal("profile.resumeUrl", config.profile.resumeUrl);

  config.highlights.forEach((item, idx) => {
    recordIfLocal(
      `highlights.${idx}.coverImage.src`,
      item.coverImage?.src
    );
    item.gallery?.forEach((img, gIdx) => {
      recordIfLocal(`highlights.${idx}.gallery.${gIdx}.src`, img.src);
    });
    item.body.forEach((block, bIdx) => {
      if (block.type === "image") {
        recordIfLocal(`highlights.${idx}.body.${bIdx}.src`, block.src);
      }
    });
  });

  config.achievements.forEach((item, idx) => {
    recordIfLocal(`achievements.${idx}.image.src`, item.image?.src);
  });

  config.testimonials.forEach((item, idx) => {
    recordIfLocal(`testimonials.${idx}.avatar.src`, item.avatar?.src);
  });

  config.gallery.forEach((item, idx) => {
    recordIfLocal(`gallery.${idx}.image.src`, item.image.src);
  });

  config.articles.forEach((item, idx) => {
    recordIfLocal(`articles.${idx}.coverImage.src`, item.coverImage?.src);
    item.body.forEach((block, bIdx) => {
      if (block.type === "image") {
        recordIfLocal(`articles.${idx}.body.${bIdx}.src`, block.src);
      }
    });
  });

  return checks;
}

export interface LoadedPortfolioContent {
  config: PortfolioConfig;
  resumeAssetExists: boolean;
}

let cachedResult: LoadedPortfolioContent | null = null;

export function loadCommittedPortfolioContent(): LoadedPortfolioContent {
  if (cachedResult) {
    return cachedResult;
  }

  const validation = validatePortfolioConfig(rawPortfolioJson);
  if (!validation.success) {
    const formatted = validation.issues
      .map((issue) => `  - [${issue.path}]: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid portfolio configuration in src/content/portfolio.json:\n${formatted}`
    );
  }

  const config = validation.data;
  const resumeUrl = config.profile.resumeUrl?.trim();
  const resumeAssetExists = resumeUrl
    ? resumeUrl.startsWith("/")
      ? checkLocalFileExistsAndNonEmpty(resumeUrl)
      : true
    : false;

  cachedResult = {
    config,
    resumeAssetExists,
  };
  return cachedResult;
}
