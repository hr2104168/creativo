# Creativo

Creativo is a Next.js social platform for sharing short creative writing, art ideas, prompts, reactions, comments, bookmarks, and user profiles.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Database

Local development uses the SQLite database at:

```text
prisma/dev.db
```

Vercel production uses Turso. Add these environment variables in Vercel:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
```

## Deploy

This repo is now a root-level Next.js app. Vercel should use:

```text
Framework Preset: Next.js
Install Command: npm install
Build Command: npm run vercel-build
Output Directory: empty
Root Directory: empty / repository root
```

## Team Members

| Name            |   QUID    | Role                              |
|-----------------|-----------|-----------------------------------|
| Hanin M. Said   | 202104168 | Authentication (Register & Login) |
| Mahajuba Rahman | 202311830 | News Feed                         |
| Ashley Danoy    | 202304384 | Posts (Create, Like, Comment)     |
| Jawairia Ahmed  | 202208287 | User Profile                      |
