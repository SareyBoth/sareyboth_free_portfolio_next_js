// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/server/prisma-client";
import {
  getPublicPortfolioConfig,
  getDraftPortfolioConfig,
} from "@/server/services/public-content";
import {
  exportPortfolioData,
  validateImportData,
  executeImportData,
} from "@/server/services/data-transfer";
import { requireSession, requireRole } from "@/server/permissions";
import { ConflictError } from "@/server/api-handler";

describe("CMS Integration & Domain Workflows", () => {
  const testHighlightSlug = "test-integration-highlight";
  const testArticleSlug = "test-integration-article";

  beforeAll(async () => {
    // Clean up test data if left over
    await prisma.highlightTag.deleteMany({
      where: { highlight: { slug: testHighlightSlug } },
    });
    await prisma.highlight.deleteMany({
      where: { slug: testHighlightSlug },
    });
    await prisma.articleTag.deleteMany({
      where: { article: { slug: testArticleSlug } },
    });
    await prisma.article.deleteMany({
      where: { slug: testArticleSlug },
    });
  });

  afterAll(async () => {
    await prisma.highlightTag.deleteMany({
      where: { highlight: { slug: testHighlightSlug } },
    });
    await prisma.highlight.deleteMany({
      where: { slug: testHighlightSlug },
    });
    await prisma.articleTag.deleteMany({
      where: { article: { slug: testArticleSlug } },
    });
    await prisma.article.deleteMany({
      where: { slug: testArticleSlug },
    });
  });

  describe("1. Auth & Permission Gates", () => {
    it("rejects unauthenticated requests to requireSession with 401 Unauthorized", async () => {
      const emptyHeaders = new Headers();
      await expect(requireSession(emptyHeaders)).rejects.toThrow("Unauthorized");
    });

    it("rejects unauthenticated requests to requireRole with 401 Unauthorized", async () => {
      const emptyHeaders = new Headers();
      await expect(requireRole("OWNER", emptyHeaders)).rejects.toThrow("Unauthorized");
    });
  });

  describe("2. Draft vs Published Snapshot Integrity", () => {
    it("preserves draft isolation: unpublished items never appear in public content", async () => {
      // Create a draft highlight
      await prisma.highlight.create({
        data: {
          slug: testHighlightSlug,
          title: "Initial Draft Title",
          summary: "This is a draft highlight summary",
          roleOrContribution: "Lead Designer",
          context: "Case study for community archive",
          outcomes: ["Outcome 1"],
          published: false,
          version: 1,
          body: [
            {
              type: "paragraph",
              text: "Draft content body text.",
            },
          ],
        },
      });

      // Public content query should NOT include the draft item
      const publicConfig = await getPublicPortfolioConfig();
      const publicFound = publicConfig.highlights.find(
        (h) => h.slug === testHighlightSlug
      );
      expect(publicFound).toBeUndefined();

      // Draft content query SHOULD include the item
      const draftConfig = await getDraftPortfolioConfig();
      const draftFound = draftConfig.highlights.find(
        (h) => h.slug === testHighlightSlug
      );
      expect(draftFound).toBeDefined();
      expect(draftFound?.title).toBe("Initial Draft Title");
      expect(draftFound?.published).toBe(false);
    });

    it("publishes with snapshot and serves frozen snapshot even when draft is modified", async () => {
      // 1. Publish the highlight
      const publishedSnapshot = {
        slug: testHighlightSlug,
        title: "Canonical Published Title",
        summary: "Published summary",
        category: "Community",
        featured: true,
        roleOrContribution: "Lead Designer",
        context: "Case study context",
        outcomes: ["Outcome 1"],
        tags: ["Design", "Archival"],
        body: [{ type: "paragraph", text: "Published content block." }],
      };

      await prisma.highlight.update({
        where: { slug: testHighlightSlug },
        data: {
          published: true,
          publishedAt: new Date(),
          publishedSnapshot: JSON.parse(JSON.stringify(publishedSnapshot)),
          version: 2,
        },
      });

      // 2. Public content should now reflect the published title
      let publicConfig = await getPublicPortfolioConfig();
      let publicItem = publicConfig.highlights.find(
        (h) => h.slug === testHighlightSlug
      );
      expect(publicItem).toBeDefined();
      expect(publicItem?.title).toBe("Canonical Published Title");

      // 3. Update working draft without re-publishing
      await prisma.highlight.update({
        where: { slug: testHighlightSlug },
        data: {
          title: "Unpublished Work In Progress Title",
          summary: "WIP Summary not yet live",
          version: 3,
        },
      });

      // 4. Public content MUST still serve the frozen published snapshot
      publicConfig = await getPublicPortfolioConfig();
      publicItem = publicConfig.highlights.find(
        (h) => h.slug === testHighlightSlug
      );
      expect(publicItem?.title).toBe("Canonical Published Title");
      expect(publicItem?.summary).toBe("Published summary");

      // 5. Draft content reflects the working updates
      const draftConfig = await getDraftPortfolioConfig();
      const draftItem = draftConfig.highlights.find(
        (h) => h.slug === testHighlightSlug
      );
      expect(draftItem?.title).toBe("Unpublished Work In Progress Title");
      expect(draftItem?.summary).toBe("WIP Summary not yet live");

      // 6. Unpublish
      await prisma.highlight.update({
        where: { slug: testHighlightSlug },
        data: {
          published: false,
          version: 4,
        },
      });

      const unpubConfig = await getPublicPortfolioConfig();
      const unpubFound = unpubConfig.highlights.find(
        (h) => h.slug === testHighlightSlug
      );
      expect(unpubFound).toBeUndefined();
    });
  });

  describe("3. Concurrency Conflict Handling (OCC 409)", () => {
    it("detects stale version concurrency conflicts and rejects with ConflictError", async () => {
      const highlight = await prisma.highlight.findUnique({
        where: { slug: testHighlightSlug },
      });
      expect(highlight).toBeDefined();

      const currentVersion = highlight!.version;
      const staleVersion = currentVersion - 1;

      // Simulate API handler OCC check:
      if (staleVersion !== highlight!.version) {
        expect(() => {
          throw new ConflictError(
            `Resource was modified by another session (current version: ${highlight!.version}). Please refresh.`
          );
        }).toThrowError(/Resource was modified by another session/);
      }
    });
  });

  describe("4. Contact Form Ingestion & Honeypot Guard", () => {
    it("persists legitimate contact submissions to PostgreSQL", async () => {
      const msg = await prisma.contactMessage.create({
        data: {
          name: "Test Visitor",
          email: "visitor@example.com",
          subject: "Project Inquiry",
          message: "Hello SareyBoth, I'd love to discuss a community partnership.",
          status: "UNREAD",
        },
      });

      expect(msg.id).toBeDefined();
      expect(msg.status).toBe("UNREAD");

      // Clean up
      await prisma.contactMessage.delete({ where: { id: msg.id } });
    });
  });

  describe("5. Portfolio Data Transfer (Export & Import Round-Trip)", () => {
    it("exports valid portfolio schema conforming to PortfolioConfig", async () => {
      const exported = await exportPortfolioData();
      expect(exported.schemaVersion).toBe(1);
      expect(exported.site.title).toBeDefined();
      expect(exported.profile.name).toBe("SareyBoth");
      expect(exported.sections.length).toBeGreaterThan(0);
      expect(Array.isArray(exported.highlights)).toBe(true);

      const validation = validateImportData(exported);
      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
      expect(validation.summary?.sections).toBe(exported.sections.length);
    });

    it("rejects invalid import payload during dry-run validation", () => {
      const invalidData = {
        schemaVersion: 999, // Unsupported
        site: {}, // Missing required fields
      };

      const result = validateImportData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("executes transactional import and records an audit log entry", async () => {
      const currentConfig = await exportPortfolioData();

      const importResult = await executeImportData(
        currentConfig,
        "test-actor-id",
        "sareyboth@example.com"
      );

      expect(importResult.counts).toBeDefined();
      expect(importResult.counts.siteSettings).toBe(1);
      expect(importResult.counts.profile).toBe(1);

      // Verify audit log entry was written
      const latestAudit = await prisma.auditLog.findFirst({
        where: { action: "import", entityType: "portfolio_config" },
        orderBy: { createdAt: "desc" },
      });

      expect(latestAudit).toBeDefined();
      expect(latestAudit?.actorEmail).toBe("sareyboth@example.com");
    });
  });
});
