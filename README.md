# SareyBothPortfolio — Free Modern Next.js Portfolio & CMS Template

**SareyBothPortfolio** is a modern, accessible, occupation-neutral personal portfolio and content management system (CMS) built by **SareyBoth**. It is 100% free and open source to use as a personal website template for students, developers, coordinators, researchers, designers, creators, educators, and freelancers.

Built natively on the **Next.js 16 App Router**, **React 19**, **TypeScript (Strict Mode)**, **Tailwind CSS 4**, **PostgreSQL**, **Prisma ORM**, and **Better Auth**, this template delivers high performance, zero-lock-in data portability, and a production-grade administrative dashboard without third-party template bloat.

---

## Table of Contents

- [Verified Tech Stack](#verified-tech-stack)
- [Key Features](#key-features)
- [Quick Start Guide](#quick-start-guide)
- [Complete NPM Script Reference](#complete-npm-script-reference)
- [Project Architecture & Directory Layout](#project-architecture--directory-layout)
- [Content Management System (CMS) Guide](#content-management-system-cms-guide)
  - [Roles & Permissions](#roles--permissions)
  - [Content Lifecycle: Draft, Preview & Publish](#content-lifecycle-draft-preview--publish)
  - [Media Asset Library](#media-asset-library)
  - [Data Portability (JSON Export & Transactional Import)](#data-portability-json-export--transactional-import)
- [Content Customization & Configuration Reference](#content-customization--configuration-reference)
  - [Managing via JSON (`src/content/portfolio.json`)](#managing-via-json-srccontentportfoliojson)
  - [Interactive Theme Customizer (`/customize`)](#interactive-theme-customizer-customize)
  - [Content Management Matrix](#content-management-matrix)
  - [Structured Content Blocks Specification](#structured-content-blocks-specification)
- [Database Architecture & Schema Reference](#database-architecture--schema-reference)
  - [Entity-Relationship Diagram](#entity-relationship-diagram)
  - [Models & Catalog](#models--catalog)
  - [Integrity & Archival Rules](#integrity--archival-rules)
- [Production Deployment & DevOps](#production-deployment--devops)
  - [Runtime Requirements](#runtime-requirements)
  - [Production Environment Variables](#production-environment-variables)
  - [CI/CD Build & Migration Pipeline](#cicd-build--migration-pipeline)
  - [Nginx Reverse Proxy & HTTPS Configuration](#nginx-reverse-proxy--https-configuration)
  - [Docker Compose Deployment](#docker-compose-deployment)
  - [Backup & Disaster Recovery](#backup--disaster-recovery)
- [Automated Testing & Verification](#automated-testing--verification)
- [License & Attribution](#license--attribution)

---

## Verified Tech Stack

| Component / Layer | Technology | Version | Notes |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.4.5` | Turbopack, Cache Components & Partial Prefetching |
| **UI Library** | React / React DOM | `19.3.0` | React 19 Server & Client Components |
| **Language** | TypeScript | `^5` | Strict type checking (`strict: true`) |
| **Styling** | Tailwind CSS 4 | `^4` | `@tailwindcss/turbopack`, custom semantic design tokens |
| **Database** | PostgreSQL | `>=15.x` | Relational storage with JSONB support |
| **ORM** | Prisma | `^7.10.1` | Type-safe queries, migrations, strict schema |
| **Authentication** | Better Auth | `^1.7.18` | Session cookies (`HttpOnly`, `SameSite=Lax`), roles |
| **Validation** | Zod | `^4.6.7` | Runtime data validation & schema contracts |
| **Icons** | Lucide React | `^1.70.0` | Clean, accessible SVG iconography |
| **Unit Testing** | Vitest + React Testing Library | `^5.1.0` | In-memory integration & component testing |
| **E2E Testing** | Playwright | `^1.65.0` | Full browser test suite (Chromium, Firefox, WebKit) |

---

## Key Features

1. **Free & Open Source Website Template:** Everything is modular, cleanly coded, and ready for you to clone, customize, and publish at zero licensing cost.
2. **Dual-Layer Architecture:**
   - **Public Portfolio (`(portfolio)`):** Fast, accessible, occupation-neutral portfolio featuring customizable sections, responsive layout, and dark/light/system theme switching.
   - **Authenticated CMS (`(admin)`):** Built-in administrative dashboard (`/dashboard`) for managing highlights, articles, journey timeline, achievements, skills, testimonials, and media.
3. **Draft, Preview & Publish Workflow:**
   - Edit working fields safely without publishing changes prematurely.
   - Preview drafts inside an authenticated live preview shell (`/preview`) that renders working drafts side-by-side with published records.
   - When ready, publish with one click to freeze an immutable `publishedSnapshot` with instantaneous on-demand cache revalidation.
4. **Three Visual Presets × Three Color Modes:**
   - **Minimal:** Warm off-white surfaces, charcoal typography, muted indigo accent.
   - **Warm:** Soft cream surfaces, deep brown typography, muted terracotta accent.
   - **Modern:** Cool neutral surfaces, dark slate typography, teal accent.
   - Supports **Light**, **Dark**, and **System** color modes with SSR-safe inline initialization to eliminate theme flashing.
5. **Zero-Lock-In Data Portability:**
   - Full JSON export (`PortfolioConfig` Schema v1) of all database records.
   - Safe dry-run import validator to preview schema compatibility before committing changes.
   - Transactional import (`prisma.$transaction`) ensuring all-or-nothing rollback on errors.
6. **Built-in Media Library:** Secure server-side file uploads with bounded streaming (`busboy`), MIME/magic-byte validation, SHA-256 deduplication, and media picker modal integration across all editors.
7. **Zero-Credential Contact Flow:** Client-side contact form that automatically encodes and opens draft messages in the visitor's mail client (`mailto:`), plus direct email integration and database-backed message storage.

---

## Quick Start Guide

Follow these steps to run the project locally on your machine.

### Prerequisites

- **Node.js:** `v20.19.0+` or `v22.12.0+` (LTS recommended).
- **PostgreSQL:** Running locally on port `5432` or via Docker.
- **npm:** Package manager bundled with Node.js.

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/SareyBothPortfolio.git
cd SareyBothPortfolio
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Open `.env` in your editor and verify your database connection and secrets:

```env
# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3000"

# Secret (min 32 random characters for development/production)
BETTER_AUTH_SECRET="sareyboth-development-secret-key-at-least-32-chars-long-123456"

# PostgreSQL Database Connection URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sareyboth_portfolio?schema=public"
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sareyboth_portfolio_test?schema=public"

# Initial Owner Bootstrap Account
INITIAL_OWNER_EMAIL="sareyboth@example.com"
INITIAL_OWNER_NAME="SareyBoth"
INITIAL_OWNER_PASSWORD="Password123!"

# Local Media Storage
MEDIA_STORAGE_DIR="storage/media"
```

> [!TIP]
> If you have Docker installed, you can start PostgreSQL and Mailpit with a single command:
> ```bash
> docker compose up -d postgres
> ```

### Step 4: Create and Migrate the Database

Run the automated script to create the PostgreSQL databases and apply Prisma schema migrations:

```bash
# 1. Create development and test databases if they don't exist
npm run db:create

# 2. Generate Prisma Client
npm run db:generate

# 3. Apply migrations
npm run db:migrate:dev
```

### Step 5: Import Baseline Content & Seed Defaults

Populate the database with the baseline portfolio data from `src/content/portfolio.json`:

```bash
npm run db:import
```

### Step 6: Bootstrap the Owner Account

Create your initial administrative owner user in Better Auth:

```bash
npm run auth:bootstrap
```

> **Default Owner Credentials:**
> - **Email:** `sareyboth@example.com`
> - **Password:** `Password123!`
> *(You can customize these via flags: `npx tsx scripts/bootstrap-owner.ts --email=your@email.com --password=YourPassword123!`)*

### Step 7: Run the Development Server

```bash
npm run dev
```

Open your browser to:
- **Public Portfolio:** [http://localhost:3000](http://localhost:3000)
- **Theme Customizer:** [http://localhost:3000/customize](http://localhost:3000/customize)
- **CMS Admin Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard) *(Sign in with your Owner credentials)*

---

## Complete NPM Script Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server with Turbopack on port `3000`. |
| `npm run build` | Generates Prisma client, validates content schema, and compiles Next.js for production. |
| `npm start` | Runs the compiled Next.js production server. |
| `npm run lint` | Runs ESLint to check code quality and Next.js best practices. |
| `npm run typecheck` | Generates Next.js route types and executes strict TypeScript typechecking (`tsc --noEmit`). |
| `npm run validate:content` | Validates `src/content/portfolio.json` schema and checks that all referenced local assets exist. |
| `npm run db:create` | Creates runtime and test PostgreSQL databases if missing. |
| `npm run db:generate` | Generates Prisma client types from `prisma/schema.prisma`. |
| `npm run db:migrate:dev` | Creates and applies new migrations in development. |
| `npm run db:migrate:deploy` | Applies pending migrations in production CI/CD pipelines. |
| `npm run db:seed` | Seeds database defaults and initial categories. |
| `npm run db:import` | Transactionally imports `src/content/portfolio.json` into PostgreSQL. |
| `npm run auth:bootstrap` | Bootstraps or resets the Owner administrative account. |
| `npm test` | Runs unit and integration test suite via Vitest. |
| `npm run test:watch` | Runs Vitest in interactive watch mode. |
| `npm run test:e2e` | Executes Playwright end-to-end browser test suite. |

---

## Project Architecture & Directory Layout

```text
├── prisma/
│   ├── migrations/                      # Version-controlled SQL migrations
│   ├── schema.prisma                    # PostgreSQL schema definition & models
│   └── seed.ts                          # Initial seed script
├── public/
│   ├── documents/                       # Static documents (sample resume PDF)
│   └── images/                          # Static SVGs, portraits, gallery & social card
├── scripts/
│   ├── bootstrap-owner.ts               # Terminal Owner account bootstrap script
│   ├── create-dbs.ts                    # PostgreSQL database creation utility
│   ├── import-portfolio.ts              # Transactional JSON-to-PostgreSQL importer
│   └── validate-content.ts              # CLI schema & local asset validator
├── src/
│   ├── app/
│   │   ├── (admin)/dashboard/           # Authenticated CMS administrative dashboard
│   │   │   ├── highlights/              # Highlight case study manager & block editor
│   │   │   ├── articles/                # Journal essay manager
│   │   │   ├── profile/                 # Profile & bio settings
│   │   │   ├── sections/                # Section visibility & reordering
│   │   │   ├── strengths/               # Categorized skills manager
│   │   │   ├── journey/                 # Career & education timeline manager
│   │   │   ├── achievements/            # Certifications & honors manager
│   │   │   ├── testimonials/            # Recommendations manager
│   │   │   ├── services/                # Services & packages manager
│   │   │   ├── gallery/                 # Visual works manager
│   │   │   ├── media/                   # Media library & upload manager
│   │   │   ├── messages/                # Contact form submissions inbox
│   │   │   ├── appearance/              # Theme presets & design token controls
│   │   │   ├── site-settings/           # Title, SEO & indexing controls
│   │   │   ├── data/                    # JSON export & transactional import
│   │   │   ├── users/                   # Staff user management (Owner only)
│   │   │   └── audit/                   # Chronological audit log inspection (Owner only)
│   │   ├── (auth)/                      # Staff authentication routes (/login, /forgot-password, /reset-password)
│   │   ├── (portfolio)/                 # Public-facing portfolio routes (/, /highlights/[slug], /journal)
│   │   ├── (preview)/preview/           # Authenticated live draft preview shell (/preview)
│   │   ├── api/                         # Next.js API route handlers (admin CMS, auth, contact, media)
│   │   ├── customize/page.tsx           # Interactive client-side theme customizer
│   │   ├── globals.css                  # Semantic CSS design tokens & scoping
│   │   ├── layout.tsx                   # Root layout with SSR-safe theme script & skip link
│   │   ├── not-found.tsx                # Accessible 404 page
│   │   ├── robots.ts                    # Dynamic robots.txt metadata route
│   │   └── sitemap.ts                   # Dynamic sitemap.xml metadata route
│   ├── components/
│   │   ├── admin/                       # DashboardShell, BlockEditor, MediaPicker, Form components
│   │   ├── customizer/                  # Split-screen theme customizer workspace
│   │   ├── layout/                      # AppearanceProvider, SiteHeader, SiteFooter
│   │   ├── sections/                    # Modular portfolio section renderers
│   │   └── ui/                          # Button, Modal, ThemeToggle, ContentBlocksRenderer
│   ├── content/
│   │   └── portfolio.json               # Canonical baseline portfolio content & schema
│   ├── lib/
│   │   ├── appearance/theme.ts          # Color mode & preset resolution helpers
│   │   ├── contact/mailto.ts            # Client-side mailto draft encoder & form validator
│   │   ├── content/                     # Zod schema definitions, date parser, server loaders
│   │   └── seo/metadata.ts              # SEO metadata & JSON-LD Person schema builder
│   ├── proxy.ts                         # Request middleware (route protection & 404 rewrite)
│   ├── server/
│   │   ├── auth-config.ts               # Better Auth server configuration
│   │   ├── permissions.ts               # Role guards (requireRole, requireSession)
│   │   ├── prisma-client.ts             # Central singleton Prisma Client
│   │   └── services/                    # Business logic (public content, data transfer, media)
│   └── types/
│       └── portfolio.ts                 # Inferred TypeScript types
├── storage/
│   └── media/                           # Persistent local media asset storage
├── tests/
│   ├── e2e/                             # Playwright browser smoke & dashboard test suites
│   ├── integration/                     # Vitest CMS domain & database integration tests
│   └── unit/                            # Vitest component & utility tests
├── docker-compose.yml                   # Ready-to-use Docker Compose for PostgreSQL & Mailpit
├── LICENSE                              # MIT License
└── README.md                            # Comprehensive project guide
```

---

## Content Management System (CMS) Guide

SareyBothPortfolio includes a full-featured, authenticated CMS dashboard accessible at `/dashboard`.

### Roles & Permissions

The application implements a strict two-tier Role-Based Access Control (RBAC) model:

| Action / Capability | OWNER Role | EDITOR Role | Visitor / Public |
| :--- | :---: | :---: | :---: |
| View live published portfolio | Yes | Yes | Yes |
| Submit contact form | Yes | Yes | Yes |
| Sign in / Reset password | Yes | Yes | No |
| Access Dashboard (`/dashboard`) | Yes | Yes | No |
| Access Live Draft Preview (`/preview`) | Yes | Yes | No |
| Create, edit, and draft portfolio items | Yes | Yes | No |
| Upload & manage media assets | Yes | Yes | No |
| View & manage contact form submissions | Yes | Yes | No |
| Publish / unpublish / archive content | **Yes** | No | No |
| Manage global site appearance & design tokens | **Yes** | No | No |
| Edit site metadata, canonical URL & indexing | **Yes** | No | No |
| Manage staff user accounts & roles | **Yes** | No | No |
| Export & transactional JSON import | **Yes** | No | No |
| View system audit activity logs | **Yes** | No | No |

> [!IMPORTANT]
> **Owner Protection:** Built-in safeguards prevent the last active Owner account from being demoted or deleted. Public account self-registration is strictly disabled; all new staff accounts must be created by an active Owner in `/dashboard/users`.

---

### Content Lifecycle: Draft, Preview & Publish

To ensure public site stability, SareyBothPortfolio uses a dual-state snapshot architecture:

```mermaid
flowchart LR
    A["1. Draft Creation / Edit\n(Working DB Columns)"] --> B["2. Save Draft\n(Optimistic Concurrency Check)"]
    B --> C["3. Private Preview\n(/preview)"]
    C --> D{"Review Passed?"}
    D -- Needs Changes --> A
    D -- Ready to Publish --> E["4. Publish Action\n(Freeze Snapshot & Revalidate)"]
    E --> F["5. Live Public Portfolio\n(/, /highlights, /journal)"]
```

1. **Working Drafts & Concurrency Control:**
   - Edits to Highlights, Articles, or Profile details are saved to primary database columns.
   - An optimistic concurrency version check (`version` column) prevents unintentional overwriting if multiple editors work on the same record simultaneously (returning `HTTP 409 Conflict`).
2. **Private Live Preview (`/preview`):**
   - Requires active staff authentication.
   - Injected with `<meta name="robots" content="noindex, nofollow, noarchive" />` and `Cache-Control: private, no-store`.
   - Displays a floating banner: `DRAFT PREVIEW MODE — Live Unpublished Changes`.
   - Shows working drafts using real portfolio UI components so you can inspect mobile responsiveness, typography, and image aspect ratios prior to publishing.
3. **Publishing & Frozen Snapshots:**
   - Clicking **Publish** validates the record and freezes an immutable JSON payload into `publishedSnapshot` with a timestamp `publishedAt`.
   - Public pages exclusively read from `publishedSnapshot` where `published = true` and `archivedAt IS NULL`.
   - On-demand Next.js tag cache revalidation triggers immediate updates across public routes without rebuilding or restarting the application server.

---

### Media Asset Library

- **Upload Endpoint:** Integrated inside `/dashboard/media` and via the Media Picker modal in all editors.
- **Server-Side Validation:**
  - Files are streamed via `busboy` directly into persistent storage outside the public web root (`storage/media/`).
  - Strict magic-byte inspection verifies file signatures (PNG, JPEG, WebP, SVG, AVIF, PDF).
  - Maximum file size: `10 MB`.
  - SHA-256 content hashing deduplicates uploaded files automatically.
- **Delivery:** Files are served through `/api/media/[key]` with caching headers and Content-Disposition handling.

---

### Data Portability (JSON Export & Transactional Import)

You maintain complete ownership of your portfolio data with zero platform lock-in:

- **JSON Export (`/dashboard/data`):** Download your entire portfolio state (profile, settings, sections, highlights, journey, achievements, testimonials, taxonomies) as a standard `PortfolioConfig` Schema v1 JSON file.
- **Dry-Run Validation:** When uploading a JSON file, the validator verifies schema compliance and displays a breakdown summary without touching the database.
- **Transactional Import:** Executing an import runs within a single PostgreSQL transaction (`prisma.$transaction`). If any constraint fails, the entire transaction rolls back cleanly, guaranteeing zero partial or corrupted imports.
- **System Audit Log:** All export and import operations are logged to `/dashboard/audit` with actor identity, timestamp, and client IP address.

---

## Content Customization & Configuration Reference

There are two ways to customize the portfolio:
1. **Via the Database CMS Dashboard (`/dashboard`):** Use the authenticated web interface.
2. **Via Static JSON (`src/content/portfolio.json`):** Edit the file directly or use the visual `/customize` tool.

---

### Managing via JSON (`src/content/portfolio.json`)

All configuration is strictly typed and validated against `PortfolioConfig` Schema v1:

```json
{
  "schemaVersion": 1,
  "site": {
    "title": "SareyBoth — Portfolio",
    "description": "Personal portfolio and creative highlights of SareyBoth.",
    "siteUrl": "https://sareybothportfolio.example.com",
    "locale": "en-US",
    "socialImage": {
      "src": "/images/social-card.svg",
      "alt": "SareyBoth Portfolio Social Card",
      "width": 1200,
      "height": 630
    },
    "indexable": false
  },
  "profile": {
    "name": "SareyBoth",
    "descriptor": "Community Program Coordinator, Archival Researcher & Field Workshop Facilitator",
    "introduction": "Introductory summary displayed in hero section.",
    "biography": [
      "First paragraph of biography.",
      "Second paragraph of biography."
    ],
    "portrait": {
      "src": "/images/sareyboth-portrait.svg",
      "alt": "Illustrated portrait of SareyBoth wearing glasses and a slate jacket",
      "width": 640,
      "height": 640
    },
    "location": "Portland, OR",
    "availability": "Available for community workshops, archival consulting, and seasonal collaborations",
    "resumeUrl": "/documents/sareyboth-resume.pdf",
    "contactEmail": "sareyboth@example.com"
  }
}
```

> [!NOTE]
> **Automatic SEO Safety:** As long as `site.siteUrl` is set to a sample or localhost domain, or `site.indexable` is `false`, the template automatically emits `noindex, nofollow` metadata and disallows search engine crawlers in `/robots.txt`.

---

### Interactive Theme Customizer (`/customize`)

Visit `/customize` in your browser to adjust styling and layout in real time:
- **Visual Presets:** Switch between `minimal`, `warm`, and `modern`.
- **Color Mode:** Choose default visitor preference (`light`, `dark`, or `system`).
- **Typography:** Choose between modern grotesque sans-serif (`sans`) or editorial serif (`serif`).
- **Density & Radius:** Adjust vertical spacing density (`compact`, `comfortable`, `spacious`) and corner radii (`sharp`, `subtle`, `rounded`).
- **Section Ordering:** Drag or move sections up and down, toggle sections on or off, and customize section titles.
- **Export / Import:** Click **Export JSON** to download your custom configuration, or **Import JSON** to test an existing backup file.

---

### Content Management Matrix

| Public Section / Field | Database Model | Dashboard Route | Min Role | Public Component / Renderer |
| :--- | :--- | :--- | :---: | :--- |
| **Site Metadata** | `SiteSettings` | `/dashboard/site-settings` | OWNER | `<title>`, `<meta name="description">`, `robots.txt`, `sitemap.xml` |
| **Profile** | `Profile` | `/dashboard/profile` | OWNER | `HeroSection.tsx`, `AboutSection.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx` |
| **Social Links** | `SocialLink` | `/dashboard/social-links` | EDITOR | Header icons, Footer links, Contact section links |
| **Quick Facts** | `QuickFact` | `/dashboard/quick-facts` | EDITOR | `AboutSection.tsx` ("At a Glance" list) |
| **Values** | `ValueItem` | `/dashboard/values` | EDITOR | `AboutSection.tsx` ("Guiding Principles") |
| **Sections Nav** | `Section` | `/dashboard/sections` | OWNER | `SectionRenderer.tsx`, `SiteHeader.tsx` |
| **Strengths** | `StrengthGroup` & `StrengthItem` | `/dashboard/strengths` | EDITOR | `StrengthsSection.tsx` (categorized skill cards) |
| **Highlights** | `Highlight`, `HighlightCategory`, `Tag` | `/dashboard/highlights` | EDITOR (CRUD), OWNER (Pub) | `HighlightsSection.tsx`, `/highlights/[slug]` |
| **Journey** | `JourneyEntry` | `/dashboard/journey` | EDITOR | `JourneySection.tsx` (career & education timeline) |
| **Achievements**| `Achievement` | `/dashboard/achievements` | EDITOR | `AchievementsSection.tsx` (honors, certifications) |
| **Testimonials** | `Testimonial` | `/dashboard/testimonials` | EDITOR | `TestimonialsSection.tsx` (quotes & endorsements) |
| **Services** | `Service` | `/dashboard/services` | EDITOR | `ServicesSection.tsx` (client service packages) |
| **Journal** | `Article`, `Tag` | `/dashboard/articles` | EDITOR (CRUD), OWNER (Pub) | `JournalSection.tsx`, `/journal`, `/journal/[slug]` |
| **Interests** | `Interest` | `/dashboard/interests` | EDITOR | `InterestsSection.tsx` (hobbies & creative pursuits) |
| **Gallery** | `GalleryItem` | `/dashboard/gallery` | EDITOR | `GallerySection.tsx` (photography & artwork grid) |
| **Resume** | Singleton / MediaAsset | `/dashboard/profile` | OWNER | `ResumeSection.tsx`, Hero download button |
| **Messages** | `ContactMessage` | `/dashboard/messages` | EDITOR | Portfolio contact form submissions inbox |
| **Appearance** | `PresentationSettings` | `/dashboard/appearance` | OWNER | Root `<html>` tokens (`data-preset`, `data-mode`, etc.) |
| **Labels & Copy**| `LabelsSettings` | `/dashboard/labels` | OWNER | CTA button text, filter labels, empty states |
| **Footer Settings**| `FooterSettings` | `/dashboard/footer` | OWNER | Colophon copy, copyright notice, social toggles |
| **Media Assets** | `MediaAsset` | `/dashboard/media` | EDITOR | File storage, alt-text configuration, media picker |
| **Staff Accounts**| `User`, `Session`, `Account` | `/dashboard/users` | OWNER | Better Auth credentials, roles, active sessions |
| **Audit Logs** | `AuditLog` | `/dashboard/audit` | OWNER | System activity log inspection |

---

### Structured Content Blocks Specification

Highlights and Journal articles use structured JSON body blocks, preventing raw HTML injection:

```json
"body": [
  {
    "type": "heading",
    "level": 2,
    "text": "Overview & Research Background"
  },
  {
    "type": "paragraph",
    "text": "This workshop series brought together community archivists and local volunteers..."
  },
  {
    "type": "list",
    "style": "unordered",
    "items": [
      "Archived 120 oral history recordings",
      "Conducted 8 hands-on indexing sessions",
      "Published a public accessibility checklist"
    ]
  },
  {
    "type": "quote",
    "text": "Every voice in our neighborhood deserves a preserved record in the public commons.",
    "attribution": "Community Oral History Project Participant"
  },
  {
    "type": "image",
    "src": "/images/highlights/seed-catalog-cards.svg",
    "alt": "Physical seed index cards arranged by family and germination timeline",
    "caption": "Index card catalog developed during the branch library pilot.",
    "width": 800,
    "height": 500
  }
]
```

---

## Database Architecture & Schema Reference

### Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ Account : has
    User ||--o{ AuditLog : performs
    HighlightCategory ||--o{ Highlight : categorizes
    Highlight ||--o{ HighlightTag : tags
    Tag ||--o{ HighlightTag : applies
    Article ||--o{ ArticleTag : tags
    Tag ||--o{ ArticleTag : applies
    Highlight ||--o{ HighlightGalleryItem : contains
    MediaAsset ||--o{ HighlightGalleryItem : displayed_in
    StrengthGroup ||--o{ StrengthItem : contains
    MediaAsset ||--o{ Highlight : cover_image
    MediaAsset ||--o{ Article : cover_image
    MediaAsset ||--o{ Achievement : badge
    MediaAsset ||--o{ Testimonial : avatar
    MediaAsset ||--o{ GalleryItem : image
```

### Models & Catalog

- **Settings Singletons (Keyed by `id = "singleton"`):** `SiteSettings`, `Profile`, `PresentationSettings`, `ContactSettings`, `FooterSettings`, `LabelsSettings`.
- **Content Resources:** `Section`, `Highlight`, `HighlightCategory`, `Tag`, `HighlightTag`, `Article`, `ArticleTag`, `StrengthGroup`, `StrengthItem`, `JourneyEntry`, `Achievement`, `Testimonial`, `Service`, `Interest`, `GalleryItem`, `SocialLink`, `QuickFact`, `ValueItem`.
- **Media & System Records:** `MediaAsset`, `ContactMessage`, `AuditLog`.
- **Better Auth Tables:** `User`, `Session`, `Account`, `Verification`.

### Integrity & Archival Rules

1. **Foreign Key Cascades:** Deleting a `User` cascades to delete their `Session` and `Account` rows. Deleting a `StrengthGroup` cascades to delete child `StrengthItem` records.
2. **Soft Deletion & Archival:** Highlights and Articles support `archivedAt`. Archived records are omitted from active public queries while preserving historical audit references.
3. **Owner Protection:** Role validation prevents demoting or deleting the last active Owner account.

---

## Production Deployment & DevOps

### Runtime Requirements

| Component | Minimum Version | Recommended Version | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | 20.x LTS | 22.x LTS | Persistent Node.js runtime required (not Edge runtime). |
| **PostgreSQL** | 15.x | 16.x or 17.x | Relational database with JSONB support. |
| **Process Manager**| PM2, Docker, or Systemd | Docker Compose or Systemd | Runs persistent Node process `npm run start`. |
| **Reverse Proxy** | Nginx, Caddy, or Cloudflare | Nginx or Caddy | Handles TLS termination, gzip/brotli, client headers. |

---

### Production Environment Variables

Configure your production environment in `.env`:

```env
NODE_ENV="production"
PORT=3000

# Canonical URLs (matching your custom domain)
NEXT_PUBLIC_APP_URL="https://yourportfolio.com"
BETTER_AUTH_URL="https://yourportfolio.com"

# Generate a strong 32+ character random string
BETTER_AUTH_SECRET="your-ultra-secure-random-secret-key-at-least-32-chars-long"

# Production PostgreSQL Database
DATABASE_URL="postgresql://postgres:secure_db_password@db-host.example.com:5432/sareyboth_portfolio?schema=public&connection_limit=20&pool_timeout=10"

# Initial Owner Bootstrap Account
INITIAL_OWNER_EMAIL="sareyboth@example.com"
INITIAL_OWNER_NAME="SareyBoth"
INITIAL_OWNER_PASSWORD="UseAStrongTemporaryPassword123!"

# SMTP Email Dispatch (optional for contact notification & password resets)
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="postmaster@yourdomain.com"
SMTP_PASS="your_smtp_password"
SMTP_FROM="noreply@yourportfolio.com"

# Persistent Media Storage Directory
MEDIA_STORAGE_DIR="/var/data/portfolio/media"
```

---

### CI/CD Build & Migration Pipeline

In your production deployment pipeline, run these commands in sequence:

```bash
# 1. Clean install production dependencies
npm ci

# 2. Apply pending PostgreSQL schema migrations
npm run db:migrate:deploy

# 3. Generate Prisma client & build Next.js application
npm run build

# 4. Bootstrap owner user if first deployment
npm run auth:bootstrap

# 5. Start persistent Node.js server
npm run start
```

> [!IMPORTANT]
> Always execute `npm run db:migrate:deploy` in production, never `db:migrate:dev`.

---

### Nginx Reverse Proxy & HTTPS Configuration

Deploying behind Nginx ensures proper SSL termination, static asset caching, and forwarded headers for Better Auth:

```nginx
server {
    listen 80;
    server_name yourportfolio.com www.yourportfolio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourportfolio.com www.yourportfolio.com;

    ssl_certificate /etc/letsencrypt/live/yourportfolio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourportfolio.com/privkey.pem;

    # Client upload limit for Media Library
    client_max_body_size 12M;

    # Next.js Application Proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache immutable static assets
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

---

### Docker Compose Deployment

A complete production-ready [`docker-compose.yml`](./docker-compose.yml) is included:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secure_db_password
      POSTGRES_DB: sareyboth_portfolio
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  app:
    build: .
    restart: always
    environment:
      DATABASE_URL: "postgresql://postgres:secure_db_password@postgres:5432/sareyboth_portfolio?schema=public"
      NODE_ENV: "production"
      BETTER_AUTH_URL: "https://yourportfolio.com"
      NEXT_PUBLIC_APP_URL: "https://yourportfolio.com"
      BETTER_AUTH_SECRET: "your-production-secret-at-least-32-chars-long"
    volumes:
      - media_storage:/var/data/portfolio/media
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:
  media_storage:
```

---

### Backup & Disaster Recovery

#### Database Backups
```bash
# Automated daily dump
pg_dump -U postgres -h localhost -d sareyboth_portfolio -F c -b -v -f "/var/backups/portfolio_$(date +%Y%m%d).dump"

# Restoration from dump
pg_restore -U postgres -h localhost -d sareyboth_portfolio -c -v "/var/backups/portfolio_20261109.dump"
```

#### Media Asset Backups
```bash
# Rsync media storage to external backup volume
rsync -avz --delete /var/data/portfolio/media/ backup-server:/backups/portfolio/media/
```

---

## Automated Testing & Verification

The project includes unit, integration, and browser end-to-end testing suites:

```bash
# 1. Run Vitest Unit & Integration Tests (17 tests)
npm test

# 2. Run Playwright E2E Browser Tests (6 tests)
# Note: Ensure the application is built first via `npm run build`
npm run test:e2e

# 3. TypeScript Typecheck
npm run typecheck

# 4. ESLint Check
npm run lint

# 5. Content Schema & Asset Verification
npm run validate:content
```

---

## License & Attribution

- **Project Template:** Created and maintained by **SareyBoth**.
- **Software License:** Released under the [MIT License](./LICENSE). You are completely free to use, modify, distribute, and publish personal or commercial websites using this template.
- **Sample Assets:** Self-authored SVGs, sample documents, and placeholder data may be freely modified or replaced with your own content before going live.
#   s a r e y b o t h _ f r e e _ p o r t f o l i o _ n e x t _ j s  
 