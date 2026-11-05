# Template Contract

This document defines the requirements that the versioned Astro template (configured in `.opencode/config/template.json`) must satisfy. The harness agents assume these conventions; if the template does not comply, the pipeline will fail or produce incorrect output.

## Required structure

```
<template-root>/
├── package.json              # Astro + Tailwind + Keystatic deps
├── astro.config.mjs          # Static output, i18n routing, optional Keystatic
├── tsconfig.json
├── keystatic.config.ts       # Keystatic CMS config (defineConfig API)
├── cms/                      # Dual-file pattern for content collections
│   ├── postsKeystatic.ts     # Keystatic schema for posts
│   ├── postsAstro.ts         # Astro content collection schema for posts
│   ├── pagesKeystatic.ts     # Keystatic schema for pages
│   └── pagesAstro.ts         # Astro content collection schema for pages
├── src/
│   ├── components/
│   │   └── seo/
│   │       └── SEO.astro     # INMUTABLE: unified SEO component
│   ├── layouts/
│   │   └── BaseLayout.astro  # Base layout with SEO, skip-link, header, footer
│   ├── pages/
│   │   └── [...].astro       # Template demo pages (overwritten by builder)
│   ├── data/
│   │   └── site.ts           # Site data with env var fallbacks
│   ├── lib/
│   │   └── seo.ts            # JSON-LD builders (Organization, WebSite, LocalBusiness)
│   └── styles/
│       ├── base.css           # Global styles
│       └── tokens.css         # Tailwind v4 theme tokens
├── public/
│   ├── favicon.svg
│   └── robots.txt
└── .env.example              # Template env vars documented
```

## SEO.astro component (INMUTABLE)

The agents must NEVER alter `SEO.astro`. It accepts the following props:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | yes | Page title |
| `description` | string | yes | Meta description |
| `canonical` | string | yes | Canonical URL (built from `site.domain` + route) |
| `ogImage` | string | no | OG image URL (falls back to `/og-default.jpg`) |
| `ogType` | string | no | OG type (default: `website`) |
| `twitterCard` | string | no | Twitter card type (default: `summary_large_image`) |
| `hreflang` | Record<string, string> | no | Hreflang map for i18n |
| `noindex` | boolean | no | Adds `noindex` robots meta |
| `robots` | string | no | Custom robots meta content |
| `jsonLd` | object \| object[] | no | JSON-LD schema(s) to inject |
| `lang` | string | no | HTML lang attribute (default: `es`) |

The component MUST:
- Generate `<title>`, `<meta name="description">`, `<meta name="robots">`
- Generate `<link rel="canonical">`
- Generate `og:title`, `og:description`, `og:image`, `og:type`, `og:url`
- Generate `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- Generate `hreflang` alternate links when provided
- Inject JSON-LD schemas via `<script type="application/ld+json">`

## BaseLayout.astro

The base layout MUST:
- Set `<html lang>` from `site.language` or `lang` prop (default: `es`)
- Include a skip-to-content link (`SkipLink.astro`) as the first focusable element in `<body>`
- Include `SEO.astro` in `<head>` (not `MetaTags.astro` directly)
- Include GTM snippet when `PUBLIC_GTM_ID` env var is present (in `<head>`, exactly once)
- Include GA4 snippet when `PUBLIC_GA4_ID` env var is present (in `<head>`, exactly once)
- Include Consent Mode defaults before analytics scripts
- Inject `Organization` and `WebSite` JSON-LD on every page via seo.ts
- Inject `LocalBusiness` JSON-LD when contact data is available
- Load contact data from env vars (`PUBLIC_CONTACT_EMAIL`, `PUBLIC_CONTACT_PHONE`, `PUBLIC_MAPS_EMBED_URL`) with fallbacks
- Preload critical fonts if self-hosted
- Include anti-FOUC theme script for dark mode

## Feature flags (dark mode + i18n)

The template ships with these features available. The builder REMOVES them when the spec flags are off:

- **Dark mode toggle**: `ThemeToggle.astro` component with `data-theme` attribute and CSS variables. The builder removes when `features.dark_mode === false`.
- **Language switcher**: `LanguageSwitcher.astro` component that reads locale routes and links between them. The builder removes when `features.i18n.enabled === false`.

The template must clearly isolate these features in dedicated files/components so the builder can cleanly remove them.

## Environment variables

The template MUST read client-specific data from env vars, never hardcoded. Required env vars:

| Variable | Source | Description |
|----------|--------|-------------|
| `PUBLIC_SITE_URL` | `site.domain` | Production domain for canonical URLs and sitemap |
| `PUBLIC_SITE_LANG` | `site.language` | ISO 639-1 language code (default: `es`) |
| `PUBLIC_GTM_ID` | `features.gtm_id` | Google Tag Manager container ID |
| `PUBLIC_GA4_ID` | `features.ga4_id` | Google Analytics 4 measurement ID |
| `PUBLIC_CONTACT_EMAIL` | `site.contact.email` | Contact email for mailto links |
| `PUBLIC_CONTACT_PHONE` | `site.contact.phone` | Contact phone for tel links |
| `PUBLIC_MAPS_EMBED_URL` | `site.contact.mapsEmbedUrl` | Google Maps iframe embed URL |
| `PUBLIC_FORM_ACTION` | — | External form endpoint (Formspree, Getform, etc.) |
| `PUBLIC_I18N_LOCALES` | `features.i18n.locales` | Comma-separated locale codes for i18n routing |
| `ASTRO_ENABLE_KEYSTATIC` | Fase 2 flag | `true` for dev with CMS, `false` for static builds |

## JSON-LD schemas (seo.ts)

The template MUST provide these schema builders in `src/lib/seo.ts`:

| Schema | When injected | Required fields |
|--------|---------------|-----------------|
| `Organization` | Always (when `brand.name` exists) | name, url, logo, contactPoint |
| `WebSite` | Always | name, url |
| `LocalBusiness` | When contact data available | name, url, telephone, email, address, openingHours |
| `BreadcrumbList` | When breadcrumbs provided | itemListElement[] |
| `Article` / `BlogPosting` | For blog posts | headline, description, url, datePublished, author |

## Contact form

The template MUST include a contact page (`src/pages/contact.astro`) with:
- A form that posts to `PUBLIC_FORM_ACTION` (external service) when configured
- Fallback to `mailto:PUBLIC_CONTACT_EMAIL` when no endpoint is set
- Contact info sidebar showing email, phone, address, and map embed
- Client-side success message handling

## Keystatic CMS integration (Fase 2)

The template MUST support the dual-file pattern:
- `cms/{name}Keystatic.ts` — Keystatic schema (using `@keystatic/core` fields)
- `cms/{name}Astro.ts` — Astro content collection schema (using `astro/zod`)
- `keystatic.config.ts` — uses `defineConfig` API with `@keystatic/core`
- `src/content/config.ts` — imports from `cms/*Astro.ts`
- `@keystatic/astro` integration conditionally loaded in `astro.config.mjs` when `ASTRO_ENABLE_KEYSTATIC=true`

Required dependencies: `@keystatic/core`, `@keystatic/astro`, `react`, `react-dom`.

## Dummy assets

The builder will populate `src/assets/dummy/` with placeholder images during project generation. The template does not need to ship these — the Builder creates them from the spec.

## Build configuration

- `astro.config.mjs`: `output: 'static'`
- Sitemap via `@astrojs/sitemap` (generated from pages)
- `robots.txt` in `public/` allowing all crawlers, excluding `/keystatic/`
- `trailingSlash: 'never'`
- i18n routing configurable via `PUBLIC_I18N_LOCALES` env var
- `base` and `site` configurable for GitHub Pages deployment

## Validation checklist

Before publishing a new version of the template repo, verify:

- [ ] All required files exist (see structure above)
- [ ] `SEO.astro` accepts the documented props and is immutable
- [ ] `BaseLayout.astro` uses `SEO.astro` (not `MetaTags.astro` directly)
- [ ] `<html lang>` is dynamic from `siteLanguage` or prop
- [ ] Dark mode toggle (`ThemeToggle.astro`) is isolated and removable
- [ ] Language switcher (`LanguageSwitcher.astro`) is isolated and removable
- [ ] All env vars are read from `import.meta.env` with fallbacks
- [ ] Contact data reads from `PUBLIC_CONTACT_*` env vars
- [ ] GTM snippet conditional on `PUBLIC_GTM_ID`
- [ ] GA4 snippet conditional on `PUBLIC_GA4_ID`
- [ ] Consent Mode defaults before analytics
- [ ] `npm run build` succeeds with zero errors
- [ ] Sitemap is generated
- [ ] `robots.txt` exists and excludes `/keystatic/`
- [ ] `favicon.svg` exists in `public/`
- [ ] JSON-LD schemas: Organization, WebSite, LocalBusiness available in `seo.ts`
- [ ] Skip-to-content link is the first focusable element in `<body>`
- [ ] Keystatic deps in `package.json`
- [ ] `keystatic.config.ts` uses `defineConfig` API
- [ ] `cms/` directory has dual-file pattern for posts and pages
- [ ] Contact form uses `PUBLIC_FORM_ACTION` or `mailto:` fallback
- [ ] No hardcoded client data in the template
- [ ] No `@astrojs/node` adapter (static only)
- [ ] No `nodemailer` dependency (static only)
