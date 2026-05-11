# Faculty Template Schema Reconciliation

The faculty-owned template feature depends on database fields that were added to
`prisma/schema.prisma` after this project had already drifted away from Prisma
Migrate history.

## Apply on an already-drifted dev database

1. Apply the reconciliation SQL directly:

```bash
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20260426213000_reconcile_faculty_template_schema/migration.sql
```

2. Record the repo migrations as already represented on that database:

```bash
npx prisma migrate resolve --applied 20260421103000_add_outline_defense_scope_and_targets
npx prisma migrate resolve --applied 20260422194500_mvp_schema_alignment
npx prisma migrate resolve --applied 20260426213000_reconcile_faculty_template_schema
```

## Important note

Do not use `prisma migrate deploy` to replay the older historical migrations on a
database that was bootstrapped manually or via `db push`. Those migrations assume
an older schema shape and can fail or corrupt the drifted baseline.
