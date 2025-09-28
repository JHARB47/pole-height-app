# Neon Postgres + Netlify Setup

Set the following environment variable in Netlify (Site settings → Environment variables):

- Key: `DATABASE_URL`
- Value: `postgresql://neondb_owner:npg_8CZoNbatvBL5@ep-noisy-sea-aervqc49-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

Security note: Do not commit secrets to the repository. Use Netlify env vars or a secrets manager.

Test endpoint:

- Deploy, then open: `/.netlify/functions/db_test` to verify connectivity.
