# HTNC Web

Next.js frontend app for the HTNC Platform.

## Structure

```text
src/
|-- app/                     # Next.js routes, root layout, thin page composition
|   |-- about/
|   |-- auth/
|   |-- article/
|   |-- course/
|   |-- create-article/
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
|   |-- article/
|   |-- course/
|   |-- event/
|   |-- member/
|   |-- notification/
|   |-- page/
|   `-- prayer-journal/
|-- providers/               # app-wide client providers
|   |-- AuthProvider.tsx     # current access role and permission helpers
|   `-- I18nProvider.tsx     # locale state and translations
|-- styles/                  # global CSS variables and themes
`-- types/                   # shared TypeScript types
```

## Access Model

The web app supports four access roles. Role and permission constants live in `src/lib/rbac.ts`; UI should use `useAuth().can()` or `useAuth().canAny()` instead of hard-coded role checks.

- `guest`: public landing, About Us article, footer contact information, public articles, and public event calendar. No comments, enrollment, or prayer journal access.
- `church-member`: personal prayer journal CRUD, church-wide prayer sharing, course enrollment, lessons, quizzes/exams, certificates, internal articles/events, and personalized search.
- `church-admin`: local church content management, LMS management, member enrollment, events, Telegram notifications, prayer moderation, and local member permissions.
- `system-admin`: global role/permission schemas, system settings, integrations, database configuration, full data oversight, maintenance, backups, and security audits.

`AuthProvider` is mounted in `src/app/layout.tsx`, so all routes can read access state with `useAuth()`. The current implementation uses demo profiles in `src/providers/AuthProvider.tsx` until the real session API is connected.

The header Settings menu exposes the current role and quick role switching. Navigation items and primary actions are filtered by permission. The `/auth` route provides the full four-path access flow for guest, church member, church admin, and system admin previews.

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
