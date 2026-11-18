# Production Readiness Plan

## Implemented foundation

### 1. Members and households

- Household CRUD API.
- Household member assignment and removal.
- Admin household management page using production APIs.
- Existing member CRUD remains the source of household member records.

### 2. Backend permissions

- Administrative page operations require page-management permission.
- Course lessons and test operations require explicit course, lesson, or quiz permissions.
- Member creation now requires the create-member permission rather than create-or-update.
- New household, report, and audit endpoints reuse existing administrative permissions.

### 3. Operational reporting

- Attendance: event and course check-ins plus unique attendees.
- Course completion: enrollment, completion, in-progress, and completion rate.
- Serving workload: assignment totals and workload by member.
- Member engagement: active members, event participation, lesson completion, and recent prayers.
- Admin report page includes recent audit activity.

### 4. Production data

- Homepage events and KPI totals load from the event, course, and article APIs.
- Legacy mock files are no longer used by the application runtime.

### 5. Audit, privacy, backup, and tests

- Successful authenticated mutations write an audit record without request-body content.
- Privileged administrators can view recent audit activity.
- Authenticated users can export their own profile, household, progress, and prayer data.
- `scripts/backup-db.ps1` creates PostgreSQL custom-format backups with configurable retention.
- RBAC guard tests cover allowed and denied permission paths.

## Deployment actions

1. Schedule `scripts/backup-db.ps1` using the production scheduler and store output outside the application host.
2. Encrypt backup storage and test restoration on a non-production database every quarter.
3. Define retention periods for audit, prayer, notification, and member data with church leadership.
4. Restrict database and backup credentials to the application and backup identities.
5. Add the targeted API test command and TypeScript checks to CI before deployment.
6. Review report access and household roles with operational owners before production use.

## Success criteria

- Household changes can be completed from the admin interface.
- Every administrative mutation requires an explicit permission and creates an audit entry.
- Operational reports load only for authorized administrators.
- Public pages do not depend on runtime mock data.
- A backup can be restored successfully and privacy exports contain only the requesting user's data.
