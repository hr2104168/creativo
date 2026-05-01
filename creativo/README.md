Creativo is a Next.js social platform for sharing short creative messages, following creators, reacting, commenting, and editing user profiles.

## Getting Started

From a fresh copy of the project, run these commands inside the `creativo` folder:

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The local database uses SQLite. The default `.env` value is:

```bash
DATABASE_URL="file:./dev.db"
```

## Demo Accounts

The seed file creates several accounts and posts. You can log in with any of these:

```text
luna@creativo.app / Luna1234!
ink@creativo.app / Ink12345!
reem@creativo.app / Reem1234!
spark@creativo.app / Spark123!
noor@creativo.app / Noor1234!
```

## Useful Commands

```bash
npm run dev        # start the development server
npm run build      # create a production build
npm run start      # run the production build
npm run db:migrate # apply Prisma migrations
npm run db:seed    # reset and populate the database with demo data
npm run db:studio  # inspect the SQLite data in Prisma Studio
```

## Phase 2 Demo Flow

1. Log in as `luna@creativo.app`.
2. Share two new messages from the feed.
3. Open Luna's profile and show both messages.
4. Delete one message and show the profile count updates.
5. Follow another creator from search or Suggested Creators.
6. Open My Feed and show followed creator posts.
7. Unfollow that creator and show those posts leave My Feed.
8. Bookmark a post and show that it appears in the Saved tab.
9. Log out, then log in as a different seeded user.
10. Visit Luna's profile and show the remaining message is still visible.
11. Show the profile statistics before and after creating, following, or deleting content.
