# GridSense AI — Product Requirements Document

## Original Problem Statement
Build "GridSense AI" — an AI-powered EV grid management dashboard for BESCOM (Bangalore Electricity Supply Company). Two roles: customer (EV owner) and admin (BESCOM employee). Government-style design (india.gov.in / bescom.org inspired). Tech: React + FastAPI + MongoDB. JWT auth in httpOnly cookies. Recharts for charts, Leaflet for maps, rule-based AI insight strings.

## Architecture
- **Backend** (`/app/backend/server.py`): FastAPI single-file app. JWT (PyJWT) + bcrypt. MongoDB collections — `users`, `zones`, `stations`, `forecasts`, `events`, `schedules`, `sessions`. Auto-seed on startup.
- **Frontend** (`/app/frontend/src`): React Router with role-based protected routes. AuthContext provider. Axios `withCredentials: true` + localStorage Bearer fallback. Tailwind + custom government CSS variables. Sonner for toasts, Recharts for charts, react-leaflet for maps.

## User Personas
1. **EV Customer** — Bengaluru EV owner who wants cheaper, off-peak charging.
2. **BESCOM Admin** — Grid operator monitoring city-wide load and approving schedule recommendations.

## Core Requirements (Static)
- Two-role auth: customer (email/password) + admin (employee_id/password); only admins are pre-seeded.
- Government-style design: deep blue `#1a3c6e` + saffron `#f5a623`, Noto Sans / Roboto Mono, tricolor accent bar.
- 8 Bangalore zones, realistic seed data, no empty states.
- Mobile responsive customer portal; desktop-first admin sidebar.
- `/api/health` endpoint confirming DB.

## What's Been Implemented (2026-02-06)
- ✅ Landing page with role selector, tricolor bar, BESCOM branding, hero stats, feature strip
- ✅ Customer Login + Registration (with zone dropdown)
- ✅ Admin Login (Employee ID)
- ✅ Customer Portal: Dashboard (stat cards, AI recommendation, sessions table), Smart Planner (sliders + accept/reject), Stations Finder (Leaflet map + list), Profile (editable)
- ✅ Admin Portal: Live Grid Overview (stats + zone stress table + recent events), Demand Forecast (Recharts area + bar + AI insight), Schedule Optimizer (filters + approve/reject + bulk approve), Zone Intelligence Map (Leaflet color-coded + priority sidebar), Events log (severity pie + 7-day trend + filters + resolve), Customer Management (filters + history modal), Reports (stat cards + weekly bar chart + CSV download)
- ✅ JWT auth with cookie + Bearer fallback, role guards
- ✅ Seeded: 8 zones, ~40 stations, 192 forecasts, 28 events, 20 schedules, 12 customers, 3 admins
- ✅ Tested: 23/23 backend pytest pass, frontend smoke flows pass

## Next / Backlog (P1/P2)
- P1: Tighten CORS to explicit origin; set cookie `secure=True`, `samesite=none` for production HTTPS cross-origin.
- P1: Brute-force lockout on login (5 fail / 15 min).
- P2: Refresh token endpoint + rotation.
- P2: Real-time grid updates via WebSocket.
- P2: Email/SMS alerts for critical events.
- P2: Export PDF reports in addition to CSV.
- P2: Map drill-down per station with live socket telemetry.
- P2: Forecast model accuracy tracking dashboard.

## Test Credentials
- Admin: `EMP001 / bescom@123`, `EMP002 / admin@456`, `EMP003 / grid@789`
- Customer: `demo@gridsense.in / demo@123` and `<first>.<last>@example.com / user@123`
