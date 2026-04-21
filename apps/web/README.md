# HTNC Web

Next.js frontend app for the HTNC Platform.

## Structure

```text
src/
|-- app/                     # Next.js routes, root layout, thin page composition
|   |-- auth/
|   |-- blog/
|   |-- course/
|   |-- create-blog/
|   |-- event/
|   |-- member/
|   |-- notification/
|   |-- prayer-journal/
|   |-- layout.tsx
|   `-- page.tsx
|-- components/              # shared UI and layout components
|   |-- layout/              # AppShell, Header, toggles, navigation
|   `-- ui/                  # primitive controls
|-- hooks/                   # reusable client hooks
|-- lib/                     # helpers, API clients, utilities
|-- locales/                 # i18n dictionaries
|-- mockData/                # typed mock data shaped from API/DB contracts
|   |-- homepage.ts
|   `-- index.ts
|-- modules/                 # UI/business by domain
|   |-- auth/
|   |-- blog/
|   |-- course/
|   |-- event/
|   |-- member/
|   |-- notification/
|   |-- page/
|   `-- prayer-journal/
|-- providers/               # app-wide client providers
|   |-- AuthProvider.tsx     # guest/member/admin/system-admin access roles
|   `-- I18nProvider.tsx     # locale state and translations
|-- styles/                  # global CSS variables and themes
`-- types/                   # shared TypeScript types
```

## Access Model

The web app supports four access roles:

- `guest`: the default public browsing mode. Guests can view public homepage, blog, courses, and events.
- `church-member`: a logged-in member mode for profile, notifications, prayer journal, courses, and event participation.
- `church-admin`: a church staff/admin mode for publishing content, managing events/courses, and supporting member workflows.
- `system-admin`: a platform operator mode for system-wide configuration, cross-church oversight, and administrative operations.

`AuthProvider` is mounted in `src/app/layout.tsx`, so all routes can read access state with `useAuth()`. The current implementation uses demo profiles in `src/providers/AuthProvider.tsx` until the real session API is connected.

The header Settings menu exposes the current role and quick role switching. The `/auth` route provides the full four-path access flow for guest, church member, church admin, and system admin previews.

## Conventions

- Routes use `kebab-case`.
- React components use `PascalCase`.
- Hooks use the `useXxx.ts` naming pattern.
- Keep `src/app` focused on routing, layout, and thin page composition.
- Put domain UI and client-side business logic in `src/modules/<domain>`.
- Put typed mock content in `src/mockData` and shape it after API or database contracts.
- Use `useAuth()` for role-aware UI instead of reading storage directly.

## Development

```powershell
pnpm.cmd dev
```

If PowerShell allows pnpm scripts on your machine, this also works:

```powershell
pnpm dev
```
