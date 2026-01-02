# Backend — Nesttern

Run locally:

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.
2. Install deps: `npm install` inside `backend`.
3. Generate Prisma client: `npx prisma generate`.
4. Run seed: `npm run seed`.
5. Start dev server: `npm run dev`.

API structure:
- `/auth/*` — signup/login
- `/profiles/*` — user profile CRUD
- `/listings/*` — listing CRUD and search
- `/matches` — roommate matching
- `/connections/*` — connect requests
