# Quran Center API

Unified backend for the online Quran memorization center. One API serves the website and the mobile app (same accounts, same data).

**Stack:** Node.js 20+, Express, PostgreSQL, Prisma, JWT, Zod.

## Setup
```bash
cp .env.example .env        # fill DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run db:seed             # creates the first admin
npm run dev
```

## Roles
`ADMIN` (full control) · `TEACHER` (halaqat, attendance, progress) · `PARENT` (children, invoices) · `STUDENT` (own progress).

## Endpoints (prefix `/api`)
| Method | Path | Access |
|---|---|---|
| POST | /auth/login | public |
| GET | /auth/me | any |
| POST | /auth/users | admin |
| POST | /admissions | public (website form) |
| GET, PATCH | /admissions, /admissions/:id | admin |
| GET, POST | /halaqat | any / admin |
| POST | /halaqat/:id/sessions | teacher, admin (attendance) |
| POST | /progress | teacher, admin |
| GET | /progress/student/:id | owner, parent, staff |
| POST | /billing/generate | admin (monthly invoices) |
| PATCH | /billing/:id/pay | admin |
| GET | /billing/mine | parent |
| GET | /billing/stats | admin |

Live lessons use the Zoom link stored on each halaqa (`zoomLink`).

## Next phases
Website (Next.js) and mobile app (React Native / Flutter) consuming this API; push notifications; online payment gateway; PDF progress reports.
