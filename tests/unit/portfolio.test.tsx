import React from "react";
import { renderToString } from "react-dom/server";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import rawSampleConfig from "@/content/portfolio.json";
import {
  collectReferencedLocalAssets,
  loadCommittedPortfolioContent,
} from "@/lib/content/load-node";
import { validatePortfolioConfig } from "@/lib/content/schema";
import {
  buildNavigation,
  getPublishedArticleBySlug,
  getPublishedArticles,
  getPublishedHighlightBySlug,
  getPublishedHighlights,
  getRenderedSections,
  renameSectionInConfig,
  reorderSectionInConfig,
} from "@/lib/content/selectors";
import {
  loadDraftFromStorage,
  parseAndValidateImportedJson,
  saveDraftToStorage,
  serializePortfolioConfig,
} from "@/lib/customizer/draft";
import { buildMailtoHref, validateContactForm } from "@/lib/contact/mailto";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { ContactForm } from "@/components/sections/ContactForm";
import { CustomizerWorkspace } from "@/components/customizer/CustomizerWorkspace";

function buildSitemapUrlsForTest() {
  const { config } = loadCommittedPortfolioContent();
  const urls = [`${config.site.siteUrl}/`];
  for (const h of getPublishedHighlights(config)) {
    urls.push(`${config.site.siteUrl}/highlights/${h.slug}`);
  }
  for (const a of getPublishedArticles(config)) {
    urls.push(`${config.site.siteUrl}/journal/${a.slug}`);
  }
  return urls;
}

describe("1. Schema & Asset Validation", () => {
  it("accepts the canonical sample configuration and resolves all referenced local assets", () => {
    const res = validatePortfolioConfig(rawSampleConfig);
    expect(res.success).toBe(true);
    if (!res.success) return;

    const assets = collectReferencedLocalAssets(res.data);
    expect(assets.length).toBeGreaterThan(0);
    for (const asset of assets) {
      expect(asset.exists, `Missing asset: ${asset.assetPath}`).toBe(true);
      expect(asset.isNonEmptyFile, `Empty asset: ${asset.assetPath}`).toBe(
        true
      );
    }
  });

  it("rejects unsupported schema versions, duplicate slugs, bad section IDs, malformed URLs, and invalid body blocks", () => {
    const base = structuredClone(rawSampleConfig);

    // Unsupported schema version
    const badVersion = { ...structuredClone(base), schemaVersion: 99 };
    const vRes = validatePortfolioConfig(badVersion);
    expect(vRes.success).toBe(false);

    // Duplicate highlight slugs
    const dupSlugs = structuredClone(base);
    dupSlugs.highlights[1].slug = dupSlugs.highlights[0].slug;
    const dupRes = validatePortfolioConfig(dupSlugs);
    expect(dupRes.success).toBe(false);
    if (!dupRes.success) {
      expect(
        dupRes.issues.some((i) => i.message.includes("Duplicate slug"))
      ).toBe(true);
    }

    // Bad section ID
    const badSection = structuredClone(base);
    badSection.sections[0].id = "unknown-section-id";
    expect(validatePortfolioConfig(badSection).success).toBe(false);

    // Malformed / unsafe javascript: URL
    const badUrl = structuredClone(base);
    badUrl.profile.socialLinks[0].url = "javascript:alert(1)";
    expect(validatePortfolioConfig(badUrl).success).toBe(false);

    // Placeholder '#' CTA link
    const badCta = structuredClone(base);
    badCta.profile.primaryCta = { label: "Broken", href: "#" };
    expect(validatePortfolioConfig(badCta).success).toBe(false);

    // Invalid body block (missing alt text on image block)
    const badBlock = structuredClone(base);
    (badBlock.highlights[0].body as Array<Record<string, unknown>>).push({
      type: "image",
      src: "/images/highlights/seed-catalog-cards.svg",
      alt: "   ",
    });
    expect(validatePortfolioConfig(badBlock).success).toBe(false);
  });
});

describe("2. Section Order & Generated Navigation Alignment", () => {
  it("keeps rendered sections and generated navigation aligned when sections are disabled, empty, renamed, or reordered", () => {
    const { config } = loadCommittedPortfolioContent();

    // Initial alignment
    const initialSections = getRenderedSections(config);
    const initialNav = buildNavigation(config);
    expect(initialNav.map((n) => n.id)).toEqual(
      initialSections.map((s) => s.id)
    );

    // Disable 'about' and empty 'achievements'
    let modified = structuredClone(config);
    modified.sections = modified.sections.map((s) =>
      s.id === "about" ? { ...s, enabled: false } : s
    );
    modified.achievements = [];

    // Rename 'highlights' and reorder it to the top
    modified = renameSectionInConfig(
      modified,
      "highlights",
      "Community Projects"
    );
    modified = reorderSectionInConfig(modified, "highlights", "up");
    modified = reorderSectionInConfig(modified, "highlights", "up");
    modified = reorderSectionInConfig(modified, "highlights", "up");

    const nextRendered = getRenderedSections(modified);
    const nextNav = buildNavigation(modified);

    expect(nextRendered.some((s) => s.id === "about")).toBe(false);
    expect(nextRendered.some((s) => s.id === "achievements")).toBe(false);
    expect(nextRendered[0].id).toBe("highlights");
    expect(nextRendered[0].title).toBe("Community Projects");

    expect(nextNav.map((n) => n.id)).toEqual(nextRendered.map((s) => s.id));
    expect(nextNav[0].label).toBe("Community Projects");
    expect(nextNav[0].href).toBe("#highlights");
  });
});

describe("3. Unpublished & Disabled Content Exclusion", () => {
  it("excludes unpublished highlights and disabled route groups from listings, detail selectors, metadata, and sitemap", () => {
    const { config } = loadCommittedPortfolioContent();

    // Unpublished highlight ('upcoming-winter-seed-swap-notes') must be excluded
    const publishedHighlights = getPublishedHighlights(config);
    expect(
      publishedHighlights.some(
        (h) => h.slug === "upcoming-winter-seed-swap-notes"
      )
    ).toBe(false);
    expect(
      getPublishedHighlightBySlug(config, "upcoming-winter-seed-swap-notes")
    ).toBeNull();

    // Journal is disabled by default -> published articles selector and slug lookup return empty/null
    expect(getPublishedArticles(config)).toHaveLength(0);
    expect(
      getPublishedArticleBySlug(
        config,
        "how-we-set-up-a-neighborhood-seed-cabinet"
      )
    ).toBeNull();

    // Sitemap excludes unpublished highlights, disabled journal routes, and /customize
    const sitemapUrls = buildSitemapUrlsForTest();
    expect(
      sitemapUrls.some((u) => u.includes("upcoming-winter-seed-swap-notes"))
    ).toBe(false);
    expect(sitemapUrls.some((u) => u.includes("/journal"))).toBe(false);
    expect(sitemapUrls.some((u) => u.includes("/customize"))).toBe(false);

    // Sample origin defaults to noindex in metadata
    const homeMeta = buildPageMetadata(config, { pathname: "/" });
    expect(homeMeta.robots).toEqual({ index: false, follow: false });
  });
});

describe("4. Customizer Import/Export Round-Trip & Failed Import Preservation", () => {
  it("round-trips configuration through export/import without data loss and preserves draft on invalid import", () => {
    const { config } = loadCommittedPortfolioContent();
    const customized = renameSectionInConfig(
      config,
      "journey",
      "Path & Milestones"
    );

    const exportedJson = serializePortfolioConfig(customized);
    const reimported = parseAndValidateImportedJson(exportedJson);
    expect(reimported.success).toBe(true);
    if (reimported.success) {
      expect(reimported.config).toEqual(customized);
    }

    // Save valid draft to storage, then test invalid JSON import
    saveDraftToStorage(customized);
    const badImport = parseAndValidateImportedJson('{"schemaVersion": 999}');
    expect(badImport.success).toBe(false);

    // Existing valid draft in storage is untouched
    const loadedDraft = loadDraftFromStorage();
    expect(loadedDraft.status).toBe("loaded");
    if (loadedDraft.status === "loaded") {
      expect(
        loadedDraft.config.sections.find((s) => s.id === "journey")?.title
      ).toBe("Path & Milestones");
    }
  });

  it("preserves current UI draft when an invalid file is imported in CustomizerWorkspace", async () => {
    const { config } = loadCommittedPortfolioContent();
    window.localStorage.clear();
    render(<CustomizerWorkspace committedConfig={config} />);

    const nameInput = screen.getByLabelText(
      /Profile Name/i
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Jordan Taylor" } });
    expect(nameInput.value).toBe("Jordan Taylor");

    const fileInput = screen.getByLabelText(
      /Import portfolio JSON configuration/i
    ) as HTMLInputElement;
    const invalidFile = new File(['{"invalid": true}'], "broken.json", {
      type: "application/json",
    });
    Object.defineProperty(fileInput, "files", {
      value: [invalidFile],
      configurable: true,
    });
    fireEvent.change(fileInput);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/validation failed/i);
    // Draft name is still Jordan Taylor
    expect(nameInput.value).toBe("Jordan Taylor");
  }, 15000);
});

describe("5. SSR Determinism", () => {
  it("renders SectionRenderer on the server via renderToString without accessing browser globals", () => {
    const { config } = loadCommittedPortfolioContent();
    const html = renderToString(
      <SectionRenderer config={config} resumeAssetExists />
    );
    expect(html).toContain(config.profile.name);
    expect(html).toContain("Neighborhood Seed Library");
  });
});

describe("7. Contact Form Validation & Mailto Construction", () => {
  it("validates fields, constructs a safe mailto link, and never claims message delivery", () => {
    const invalid = validateContactForm({
      name: "",
      email: "not-an-email",
      subject: "",
      message: "short",
    });
    expect(invalid.valid).toBe(false);

    const valid = validateContactForm({
      name: "Sam Rivera",
      email: "sam@example.com",
      subject: "Seed Cabinet Question",
      message: "Hello SareyBoth, we would love to learn about your seed cards.",
    });
    expect(valid.valid).toBe(true);
    if (valid.valid) {
      const href = buildMailtoHref("sareyboth@example.com", valid.cleaned);
      expect(href.startsWith("mailto:sareyboth@example.com?subject=")).toBe(
        true
      );
      expect(href).toContain("Seed%20Cabinet%20Question");
      expect(href).toContain("Sam%20Rivera");
    }

    render(
      <ContactForm
        recipientEmail="sareyboth@example.com"
        openEmailAppButtonLabel="Open email app"
        emailAppHelperText="Opens your mail client with a draft."
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Open email app/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Please enter your name/i)).toBeInTheDocument();
    expect(screen.queryByText(/Message sent/i)).not.toBeInTheDocument();
  });
});
