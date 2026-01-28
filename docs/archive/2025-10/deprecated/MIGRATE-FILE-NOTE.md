# migrate.mjs Status Note

## Current Situation

The file `scripts/db/migrate.mjs` had severe corruption issues (duplicate headers, malformed syntax).

## Working Alternative

✅ **Use `scripts/db/run-migrations.mjs` instead** - This file works perfectly and handles:

- Migration table creation
- Applying pending migrations
- Transaction support with rollback
- Both timestamp and simple numbering formats

## Commands

```bash
# Run migrations
npm run db:migrate
# or directly:
node scripts/db/run-migrations.mjs
```

## Why migrate.mjs exists

The original `migrate.mjs` was meant to use `node-pg-migrate` library for up/down/status commands, but:

1. The current project only needs "up" migrations
2. `run-migrations.mjs` handles this perfectly
3. `node-pg-migrate` is installed but not actively used

## Recommendation

**Keep using `run-migrations.mjs`** - it's simpler, works reliably, and meets all current needs. The `migrate.mjs` file can be removed or rewritten if advanced migration features (rollback, status) are needed later.
