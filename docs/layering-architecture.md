# Layering architecture

## Frontend

Dependencies flow in one direction:

`Page -> Component -> Hook -> API Client`

- `app/`: routing, metadata, and composition. A server route may call `api/` to load metadata.
- `components/`: rendering and user interaction. Components consume hooks, not `services/`.
- `hooks/`: query state, mutations, cache invalidation, and UI-facing orchestration.
- `api/`: HTTP transport, request/response DTOs, and API errors.
- `mappers/`: API response to view-model conversion when the UI shape differs.
- `domain/`: framework-free business rules and stable domain configuration. Add code here only when a real rule is shared or independently testable.

The old `services/` modules are internal compatibility implementations while features are split. UI imports from them are prohibited by ESLint; new code must enter through one of the layers above.

## Backend

Dependencies flow in one direction:

`Middleware / Guard / Validation -> Controller -> Application Service -> Domain Rules / Repository -> Database`

- Controllers translate HTTP input/output and delegate immediately.
- Validation pipes reject malformed transport input before controller logic runs.
- Application services own use-case orchestration, authorization-independent business decisions, and application errors.
- Domain functions contain framework-free rules only when the rule is substantial enough to name and test.
- Repositories are the only feature classes allowed to use `PrismaService`; they contain persistence queries, not business policy.
- Guards and middleware handle cross-cutting request concerns, never feature persistence.

## Naming

- Frontend hooks: `useXxxQuery`, `useXxxMutation`, or `useXxx`.
- Frontend transport: `xxxApi` and transport DTOs.
- Backend use cases: `XxxService`; persistence: `XxxRepository`.
- Mapping functions: `mapXxx` or `toXxxViewModel`.

## Review checklist

- Does a page contain business or data-fetching logic that belongs in a component/hook?
- Does a component call `fetch`, `apiRequest`, or import `services/` directly?
- Does an API response need a mapper, or is it already the correct view shape?
- Does a controller access Prisma or implement a use case?
- Does an application service access Prisma rather than a repository?
- Is a proposed domain abstraction a real business rule rather than a renamed utility?
