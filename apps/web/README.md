# HTNC Web

Next.js frontend app for the HTNC Platform.

## Structure

```text
src/
|-- app/                     # route, layout, page
|-- modules/                 # UI/business by domain
|   |-- auth/
|   |-- member/
|   |-- blog/
|   |-- course/
|   |-- page/
|   |-- event/
|   |-- notification/
|   `-- prayer-journal/
|-- components/              # shared components
|-- lib/                     # helpers, API clients, utilities
|-- hooks/
|-- providers/
|-- styles/
`-- types/
```

## Conventions

- Routes use `kebab-case`.
- React components use `PascalCase`.
- Hooks use the `useXxx.ts` naming pattern.
- Keep `src/app` focused on routing, layout, and thin page composition.
- Put domain UI and client-side business logic in `src/modules/<domain>`.

## Development

```powershell
pnpm.cmd dev
```

If PowerShell allows pnpm scripts on your machine, this also works:

```powershell
pnpm dev
```
