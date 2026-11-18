# Frontend Coding Conventions

These conventions apply to `apps/web`.

## Shared UI primitives

Import shared UI components from the barrel module:

```tsx
import { Badge, Input, Label, Text, Title } from "@/components/ui";
```

Use semantic variants before adding Tailwind typography classes. `className` should normally contain layout concerns such as margin, width, truncation, or responsive placement.

### Titles

All application headings must use `Title`. Do not write raw `<h1>` through `<h6>` elements outside the `Title` implementation.

```tsx
<Title as="h1" variant="page">{t("page.article.title")}</Title>
<Title as="h3" variant="micro">{t("admin.category.title")}</Title>
```

Use `as` to preserve the correct document hierarchy. Choose the closest named variant from `TitleVariant`. For CMS-driven typography that must inherit inline styles, use `variant="inherit"` and `tone="inherit"`.

### Text

All application paragraphs must use `Text`. Do not write raw `<p>` elements outside the `Text` implementation.

```tsx
<Text variant="small">{t("page.article.description")}</Text>
<Text as="span" tone="tertiary" variant="meta">{authorName}</Text>
```

Use `variant="inherit"` and `tone="inherit"` when migrating bespoke or CMS-driven typography without changing its appearance.

### Labels and inputs

Use `Label` and `Input` instead of raw `<label>` and `<input>` elements.

```tsx
<Label htmlFor="search" variant="caption">
  {t("action.search")}
</Label>
<Input id="search" value={query} onChange={handleChange} />
```

Every visible form label must be associated with its control through matching `htmlFor` and `id` values. `Input` automatically applies control styling for `checkbox` and `radio` types and forwards refs.

### Badges

Use `Badge` for categories, states, compact metadata, and status indicators.

```tsx
<Badge variant={status === "published" ? "success" : "warning"}>
  {status}
</Badge>
```

Do not rebuild badge colors, padding, typography, or border radius at each call site. Add a shared variant when a reusable visual state is missing.

## Localization

Use `useTranslation()` for UI copy and localized data:

```tsx
const { t, localize } = useTranslation();

<Title as="h2" variant="card">{localize(article, "title")}</Title>
```

Do not branch on a specific locale, such as `locale === "vi"`, or directly choose fields such as `title_vi` and `title_en`. `localize()` must own language fallback so additional languages can be introduced without changing components.

## Styling rules

- Prefer design tokens such as `var(--text-primary)` over literal colors.
- Prefer a shared component variant over repeated typography utility strings.
- Keep `className` for layout and one-off state changes.
- Add a shared variant when the same visual pattern appears more than once.
- Preserve semantic HTML through the `as` prop.

## Review checks

Before completing a frontend change, confirm no application-level native primitives were introduced:

```powershell
rg -n '<h[1-6](?:\s|>)|<p(?:\s|>)|<label(?:\s|>)|<input(?:\s|>)' apps/web/src --glob '*.tsx' --case-sensitive
```

Matches are allowed only inside the corresponding shared primitive implementation. Run targeted TypeScript and ESLint checks for changed files.

## SEO and agent-friendly browsing

- Every public route must define a unique title, description, and canonical URL through Next.js metadata.
- Published dynamic content must provide route-specific metadata and structured data where an applicable Schema.org type exists.
- Add new public routes to `sitemap.ts` or ensure published CMS pages are returned by its API source.
- Keep admin, authentication, editing, member-only, quiz, and other private routes out of the sitemap and marked `noindex` where a shared layout is available.
- Preserve `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, and `/llms.txt` when changing routing.
- Browser-agent tools registered through `document.modelContext` must feature-detect support, validate runtime input, represent real visible actions, and clean up registrations with an `AbortSignal`.
- Read-only browser-agent tools must declare `readOnlyHint`; navigation or mutation tools must not claim to be read-only.
- Agent-tool failures must never prevent the ordinary interface from working.

## Performance and accessibility

- Use `next/image` for content and hero images. Give only the likely above-the-fold LCP image `priority` and `fetchPriority="high"`, and always provide an accurate `sizes` value.
- Import feature-specific styles inside the feature entry point so public routes do not download editor or admin CSS.
- Give generic link copy such as “Read more” a destination-specific accessible name.
- Never place focusable controls inside an `aria-hidden` subtree; use `inert` when hiding interactive regions.
- Send user media through `/api/media/upload`; do not embed Base64 media in persisted content. The API normalizes images to WebP (maximum 1920×1920) and videos to WebM (maximum 1080p), and returns the stored URL.
# Layer boundaries

Frontend code follows `Page -> Component -> Hook -> API Client`. Use `mappers/` for response-to-view-model conversion and `domain/` only for justified business rules. UI code must not import `services/` directly. See [layering-architecture.md](./layering-architecture.md).
