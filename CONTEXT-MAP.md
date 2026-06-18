# Context Map

## Contexts

- [Identity and Access](./src/features/auth/CONTEXT.md) - manages Google-authenticated accounts, role entry, onboarding gates, and account access states.
- [Academic Calendar](./src/features/academic-calendar/CONTEXT.md) - defines school years, semesters, terms, and active academic periods.

## Relationships

- **Identity and Access -> Users**: Identity and Access owns account role and access-state language; Users owns profile/admin-user management screens and services that operate on those accounts.
- **Identity and Access -> Portals**: The role selection portal is the public entry UI for Identity and Access flows.
- **Identity and Access -> Enrollments**: Student onboarding may create or defer active-term enrollment after the Student account role and profile are established.
- **Identity and Access -> Academic Calendar**: Deferred enrollment depends on whether an active academic term exists.
- **Course Assignments -> Academic Calendar**: Course assignments are scoped to the academic period in which the course is handled.
