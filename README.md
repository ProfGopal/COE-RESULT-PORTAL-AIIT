# AIIT Result Portal

Lightweight student result portal using React, Vite, Tailwind CSS, and Convex Auth.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start Convex development server:
   ```bash
   npx convex dev
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```

## Key features

- Student portal gated by admin-uploaded SEN values
- First-time student registration with Convex Auth and password creation
- Admin portal with file ingestion, student management, record CRUD, and batch deletion
- Real-time updates powered by Convex reactive queries

## Notes

- Set `VITE_CONVEX_URL` in `.env` to your Convex deployment URL.
- Admin credentials are seeded in `convex/values.ts`.
