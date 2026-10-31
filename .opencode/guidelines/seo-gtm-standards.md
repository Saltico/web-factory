# SEO & GTM Standards Checklist

Practical checklist the 03-seo-auditor can verify line by line on any generated Astro project.

## Title & Meta

- [ ] Every page has a unique `<title>` between 50-60 characters.
- [ ] Every page has a `<meta name="description">` between 140-160 characters.
- [ ] Exactly one `<h1>` per page.
- [ ] Heading order is logical (no skipped levels: h1 -> h2 -> h3, etc.).

## Images

- [ ] Every `<img>` has a descriptive `alt` attribute (or `alt=""` for decorative images).
- [ ] Images use optimized formats (`.avif` / `.webp`) via `astro:assets`.
- [ ] All `<img>` tags declare explicit `width` and `height` to avoid CLS.

## GTM / Analytics

- [ ] `PUBLIC_GTM_ID` is present in `.env` when `features.gtm_id` is set in site-spec.json.
- [ ] GTM snippet is injected exactly once in `<head>` (no duplicates).
- [ ] No duplicate analytics scripts (GTM + GA4 should not both fire the same pageview unless intended).

## Canonical & Open Graph

- [ ] Every page has a `<link rel="canonical" href="...">` built from `site.domain` + page route.
- [ ] `og:title` is present on every page.
- [ ] `og:description` is present on every page.
- [ ] `og:image` is present on every page (falls back to `seo.defaultImage`).
- [ ] `twitter:card` meta tag is set (at least `summary` or `summary_large_image`).

## Accessibility

- [ ] WCAG AA contrast: 4.5:1 for body text, 3:1 for large text.
- [ ] All interactive elements are keyboard-navigable.
- [ ] `<html lang="...">` is set using `site.language` or `site.locale`.
- [ ] A skip-to-content link is the first focusable element in `<body>`.

## Performance & SSG

- [ ] `output` is set to `"static"` in `astro.config`.
- [ ] No render-blocking resources (CSS is inlined or preloaded; JS is deferred).
- [ ] `sitemap.xml` is generated (via `@astrojs/sitemap`).
- [ ] `robots.txt` is generated and allows all crawlers by default.

## Structured Data

- [ ] `Organization` JSON-LD is present when `brand.name` is defined.
- [ ] `LocalBusiness` JSON-LD is present when `site.domain` and at least one `site.social` entry exist.
- [ ] JSON-LD is injected in `<head>`, not in `<body>`.
