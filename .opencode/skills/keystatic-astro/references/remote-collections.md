# Remote / fetched collections

Build-time API data loaded through Astro content collections, not Keystatic.

Astro: [Custom build-time loaders](https://docs.astro.build/en/guides/content-collections/#custom-build-time-loaders) · [Content Loader API](https://docs.astro.build/en/reference/content-loader-reference/)

**Loader contract (Astro 5+):** `defineCollection({ loader })` takes either a `Loader` object (what `glob()` and `file()` return) or a function `() => Promise<entries>` that returns an array of entries with a string `id` (or an object keyed by id). A function-form loader must return **entries**, never a `Loader` object. `file()` and `glob()` are loader factories: their return value is not data and cannot be parsed or returned from a function loader.

## Decision flow

```
Need editors to pick/reference this data in Keystatic?
├── Yes → Pattern C (fetch-to-disk + readonly Keystatic)
└── No
    ├── Need local CMS override of same shape?
    │   └── Pattern D (local + remote merge)
    ├── API reliable enough for every build?
    │   ├── Yes → Pattern A (in-memory fetch)
    │   └── No  → Pattern B (fetch + committed fallback)
    └── Just a one-off script?
        └── Use scripts/ + committed JSON; wire loader to glob or file()
```

## Pattern A — In-memory fetch

**Files:** `cms/{name}Astro.ts`, `cms/{name}Schema.ts`

- Async loader fetches API, parses with Zod, returns array of entries
- Each entry must include an `id` field (becomes collection entry id)
- **Fail-fast** if API returns empty — build must not silently ship stale data
- **Not in Keystatic** — no on-disk content folder for this collection

```ts
export const astroRemoteItemsDefinition = defineCollection({
  loader: async () => {
    const apiUrl = `${apiBaseUrl}/items`
    const data = await (await fetch(apiUrl)).json()
    const parsed = z.array(RemoteItemSchema).parse(data)
    if (parsed.length === 0) {
      throw new Error(`ERROR: Fetching ${apiUrl} returned an empty array.`)
    }
    return parsed
  },
  schema: () => RemoteItemSchema,
})
```

**Build implication:** CI/production static builds must reach the API. No offline fallback.

## Pattern B — Fetch with JSON fallback

**Files:** `cms/{name}Astro.ts`, `cms/{name}Schema.ts`, `src/content/{name}/index.json`, optional `scripts/{name}/process.ts`

- Try live fetch first; on failure or empty result, fall back to committed JSON
- Post-fetch enrichment may call additional APIs
- Maintain fallback cache via script and commit to repo when API is slow or unreliable
- Document in script README why fallback exists

```ts
import { readFile } from 'node:fs/promises'

loader: async () => {
  // `file()` returns a Loader object, not data. Read the committed JSON with fs instead.
  async function fallback() {
    const json = JSON.parse(await readFile('src/content/{name}/index.json', 'utf-8'))
    return ApiSchema.parse(json).features
  }
  const raw = await fetch(apiUrl)
  if (!raw.ok) return fallback()
  const features = await enrich(ApiSchema.parse(await raw.json()).features)
  if (features.length === 0) return fallback()
  return features
}
```

Each returned feature needs a string `id`. If the fallback file is a plain array of entries with `id`, it can instead be the whole loader for offline builds: `loader: file('src/content/{name}/index.json')`.

## Pattern C — Fetch-to-disk + glob

**Files:** `{name}Astro.ts`, `{name}Keystatic.ts`, `{name}Schema.ts`

Flow:

1. Loader calls `fetchAndStore()` — hits API, writes `src/content/{name}/{id}.json`
2. Optionally writes aggregate cache to `src/content_cache/`
3. Removes JSON files for IDs no longer in API
4. Hands the `glob()` loader (`loader(basePath, 'json')`) to `defineCollection`, so Astro reads the cached files like normal content

**Keystatic:** readonly collection with `[READONLY]` labels — editors see data and can use `fields.relationship` from other collections, but must not hand-edit.

**Why disk cache:** Git-tracked files, Keystatic visibility, relationship slugs, same consumption path as local JSON collections.

```ts
export const astroRemoteItemsDefinition = defineCollection({
  // Top-level await: `customLoader()` resolves to a Loader object (from glob()), which is what
  // `loader` accepts. Do NOT pass the function itself as `loader`: a function-form loader must
  // return entries, not a Loader.
  loader: await customLoader(),
  schema: () => RemoteItemSchema,
})

async function customLoader() {
  await fetchAndStore() // runs when the content config is evaluated
  return loader(basePath, 'json')
}
```

Because the fetch runs while `content.config.ts` is evaluated (including `astro sync` and dev start), keep it fail-fast.

## Pattern D — Local CMS + remote merge

Two Astro collections, one page contract:

| Collection    | Source  | Keystatic | Loader                              |
| ------------- | ------- | --------- | ----------------------------------- |
| `localItems`  | Editors | yes       | `glob` on `src/content/localItems/` |
| `remoteItems` | API     | none      | async fetch                         |

**Shared schema:** local schema imports and adapts remote schema — omit/transform CMS-unfriendly fields (comma-separated strings, fields only the API provides, etc.).

**Page merge:**

```ts
const localItems = await getCollection('localItems')
const remoteItems = await getCollection('remoteItems')
const allItems = [...localItems, ...remoteItems]
```

```ts
// getStaticPaths merges both; slug = item.data.id
export type Item = CollectionEntry<'localItems'> | CollectionEntry<'remoteItems'>
```

**Keystatic config:** only the local collection — remote stays out of CMS nav (unless you also want readonly visibility via pattern C).

## Comparison table

| Aspect           | A in-memory | B fallback         | C fetch-to-disk  | D local + remote        |
| ---------------- | ----------- | ------------------ | ---------------- | ----------------------- |
| Disk write       | No          | Fallback JSON only | Yes, per-id JSON | Local JSON only         |
| In Keystatic     | No          | No                 | Readonly         | Local only              |
| Fail on empty    | Yes         | Fallback           | Yes              | Remote: yes; local: N/A |
| Merge with local | No          | No                 | No               | Yes                     |

## Adding a remote collection (steps)

1. Define Zod schema matching API payload; include stable `id` per entry
2. Create `cms/{name}Astro.ts` with an async function loader that returns entries (or, for pattern C, `await customLoader()` as above)
3. Register in `src/content.config.ts` — **do not** add to `keystatic.config`
4. Choose error strategy: throw (A), fallback file (B), or write-to-disk (C)
5. If editors need a local variant: separate Keystatic collection + shared schema + page merge (D)
6. Put API base URL in a shared const (e.g. `config/api.ts`)
7. Verify CI can reach API or has fallback for static builds

## Consumption notes

- Remote entries use the same `getCollection` / `getStaticPaths` APIs as local content
- Keystatic MDX inline fields on local entries may need custom `Markdown` component instead of `render()` — see [Keystatic #1318](https://github.com/Thinkmill/keystatic/discussions/1318)
- Client-side runtime fetches are **not** content collections — keep in components
