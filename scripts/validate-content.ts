import fs from "node:fs";
import path from "node:path";
import { collectReferencedLocalAssets } from "../src/lib/content/load-node";
import { validatePortfolioConfig } from "../src/lib/content/schema";
import {
  buildNavigation,
  getPublishedArticles,
  getPublishedHighlights,
  getRenderedSections,
} from "../src/lib/content/selectors";

function main() {
  const contentPath = path.join(
    process.cwd(),
    "src",
    "content",
    "portfolio.json"
  );

  if (!fs.existsSync(contentPath)) {
    console.error(
      `[validate:content] ERROR: Content file not found at ${contentPath}`
    );
    process.exit(1);
  }

  let parsedJson: unknown;
  try {
    const rawText = fs.readFileSync(contentPath, "utf-8");
    parsedJson = JSON.parse(rawText);
  } catch (err) {
    console.error(
      `[validate:content] ERROR: Failed to parse JSON in ${contentPath}:`,
      err instanceof Error ? err.message : String(err)
    );
    process.exit(1);
  }

  const result = validatePortfolioConfig(parsedJson);
  if (!result.success) {
    console.error(
      `[validate:content] FAILED: ${result.issues.length} schema validation issue(s) in src/content/portfolio.json:`
    );
    for (const issue of result.issues) {
      console.error(`  - ${issue.path}: ${issue.message}`);
    }
    process.exit(1);
  }

  const config = result.data;
  const assetChecks = collectReferencedLocalAssets(config);
  const missingAssets = assetChecks.filter(
    (check) => !check.exists || !check.isNonEmptyFile
  );

  if (missingAssets.length > 0) {
    console.error(
      `[validate:content] FAILED: ${missingAssets.length} referenced local asset(s) are missing or empty:`
    );
    for (const missing of missingAssets) {
      console.error(
        `  - ${missing.fieldPath} -> ${missing.assetPath} (expected non-empty file at ${missing.resolvedFilePath})`
      );
    }
    process.exit(1);
  }

  const renderedSections = getRenderedSections(config);
  const navItems = buildNavigation(config);
  const publishedHighlights = getPublishedHighlights(config);
  const publishedArticles = getPublishedArticles(config);

  console.log(
    `[validate:content] OK: Schema v${config.schemaVersion} valid.`
  );
  console.log(
    `  - Profile: ${config.profile.name} (${config.profile.descriptor})`
  );
  console.log(
    `  - Rendered sections (${renderedSections.length}): ${renderedSections.map((s) => s.id).join(", ")}`
  );
  console.log(
    `  - Navigation items (${navItems.length}): ${navItems.map((n) => n.label).join(", ")}`
  );
  console.log(
    `  - Published highlights (when section enabled): ${publishedHighlights.length} / ${config.highlights.length} total`
  );
  console.log(
    `  - Published articles (when section enabled): ${publishedArticles.length} / ${config.articles.length} total`
  );
  console.log(`  - Verified local assets: ${assetChecks.length} resolved.`);
}

main();
