# Template Contract

This document defines the requirements that the versioned Astro template (configured in `.opencode/config/template.json`) must satisfy. The harness agents assume these conventions; if the template does not comply, the pipeline will fail or produce incorrect output.

## Required structure

```
<template-root>/
├── package.json              # Astro + Tailwind + Keystatic deps
├── astro.config.mjs          # Static output, i18n routing, Keystatic integration
├── tailwind.config.mjs       # Reads brand colors from site-spec (or env)
├── tsconfig.json
├── src/
│   ├── components/
│   │   └── SEO.astro         # IMMUTABLE: accepts props, never modify
│   ├── layouts/
│   │   └── Layout.astro      # Base layout with SEO, skip-link, header, footer
│   ├── pages/
│   │   └── [...].astro       # Template demo pages (overwritten by builder)
│   └── assets/
│       └── dummy/            # Placeholder images (.avif/.webp) for demo sections
├── cms/                      # Keystatic dual-file pattern (populated by builder)
├── public/
│   ├── favicon.svg
│   └── robots.txt
└── .env.example              # Template env vars documented
```

## SEO.astro component (IMMUTABLE)

The agents must NEVER alter `SEO.astro`. It accepts the following props:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | yes | Page title |
| `description` | string | yes | Meta description |
| `canonical` | string | no | Canonical URL (built from `site.domain` + route) |
| `ogImage` | string | no | OG image URL (falls back to `seo.defaultImage`) |
| `noindex` | boolean | no | Adds `noindex` robots meta |

The component MUST:
- Set `<html lang>` from site config
- Inject a skip-to-content link as the first focusable element
- Generate `<link rel="canonical">` when `site.domain` is set
- Generate `og:title`, `og:description`, `og:image`, `twitter:card`
- Inject GTM snippet when `PUBLIC_GTM_ID` env var is present (in `<head>`, exactly once)
- Inject GA4 snippet when `PUBLIC_GA4_ID` env var is present (in `<head>`, exactly once)
- Avoid double pageview tracking when both GTM and GA4 are configured
- Inject `Organization` JSON-LD when `brand.name` is defined
- Inject `LocalBusiness` JSON-LD when `site.domain` and at least one `site.social` entry exist

## Feature flags (dark mode + i18n)

The template ships with these features ON by default. The builder REMOVES them when the spec flags are off:

- **Dark mode toggle**: theme switcher component + `dark:` Tailwind variants. The builder removes all dead code when `features.dark_mode === false`.
- **Language switcher (ES/EN)**: locale-prefixed routes + switcher UI. The builder removes when `features.i18n.enabled === false`.

The template must clearly isolate these features in dedicated files/components so the builder can cleanly remove them.

## Environment variables

The template MUST read client-specific data from env vars, never hardcoded. Required env vars:

| Variable | Source | Description |
|----------|--------|-------------|
| `PUBLIC_GTM_ID` | `features.gtm_id` | Google Tag Manager container ID |
| `PUBLIC_GA4_ID` | `features.ga4_id` | Google Analytics 4 measurement ID |
| `PUBLIC_CONTACT_EMAIL` | `site.contact.email` | Contact email for mailto links |
| `PUBLIC_CONTACT_PHONE` | `site.contact.phone` | Contact phone for tel links |
| `PUBLIC_MAPS_EMBED_URL` | `site.contact.mapsEmbedUrl` | Google Maps iframe embed URL |
| `ASTRO_ENABLE_KEYSTATIC` | Fase 2 flag | `false` for static builds, `true` for dev |

## Dummy assets

The template must include placeholder images in `src/assets/dummy/` so every section renders during the demo. Formats: `.avif` and `.webp` only (via `astro:assets`). The user replaces these manually after delivery.

## Build configuration

- `astro.config.mjs`: `output: 'static'`
- Sitemap via `@astrojs/sitemap` (generated from pages)
- `robots.txt` allowing all crawlers by default
- `base` and `site` configurable for GitHub Pages deployment

## Keystatic integration (Fase 2)

The template must support the `keystatic-astro` skill's dual-file pattern:
- `cms/{name}Keystatic.ts` — Keystatic schema
- `cms/{name}Astro.ts` — Astro content collection schema
- Collections registered in `keystatic.config.*` and `src/content.config.ts`
- `@keystatic/astro` integration in `astro.config.mjs`

## Validation checklist

Before publishing a new version of the template repo, verify:

- [ ] All required files exist
- [ ] `SEO.astro` accepts the documented props and is immutable
- [ ] Dark mode toggle is isolated in a removable component
- [ ] Language switcher is isolated in a removable component
- [ ] All env vars are read from `import.meta.env`
- [ ] Dummy assets exist in `src/assets/dummy/`
- [ ] `npm run build` succeeds with zero errors
- [ ] Sitemap is generated
- [ ] `robots.txt` is generated
- [ ] JSON-LD is injected correctly
- [ ] Skip-to-content link is the first focusable element
- [ ] `<html lang>` is set correctly
- [ ] No hardcoded client data in the template
