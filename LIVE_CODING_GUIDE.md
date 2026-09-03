# Live Coding Guide — Weekly Report Dashboard

You built this with MERN + JWT role auth (same stack as your SplitNest).
Live format: **explain + add features**. This guide gives you both.

## 1. The 60-second explanation (memorize this)

> "This is a Weekly Report Dashboard in MERN with MongoDB.
> Members submit one report per week — done, plan, blockers, hours.
> Managers see the whole team's dashboard: total reports, total hours, hours-by-person bars, recent reports.
> Auth is JWT with roles. Frontend is React with Context + react-router, backend is Express + Mongoose.
> The frontend calls /api which Vite proxies to the backend, and every request carries the token."

## 2. How to explain each part (in your own words)

### Backend — `backend/index.js`
- "Express app, cors + express.json middleware, then 3 route groups: /api/auth, /api/reports, /api/dashboard."
- "It connects to MongoDB with mongoose, using MONGODB_URI from .env — works for local and Atlas. Then it listens on PORT."

### Auth — `models/User.js` + `routes/auth.js` + `middleware/auth.js`
- User: "name, email unique, password hashed, role member/manager."
- Register: "Check fields, check email not taken, bcrypt.hash password with 10 rounds, create user, sign JWT with {id, role}."
- Login: "Find user by email, bcrypt.compare password, if ok sign same JWT."
- `requireLogin`: "Reads Authorization: Bearer <token>, jwt.verify with JWT_SECRET, attaches req.user, else 401."
- `requireManager` (only used conceptually): "Checks req.user.role — dashboard route branches on it."
- Say this line confidently: **"We never store plain passwords, only bcrypt hashes. The token proves who you are on every request."**

### Reports — `models/Report.js` + `routes/reports.js`
- Report: "user ref, weekStart string like 2026-08-31, done, plan, blockers, hours. Unique index on (user, weekStart) so one report per person per week."
- GET /: "If member, force filter.user = my id. If manager, see all, optional ?user and ?weekStart filters. Populate user name, sort newest first."
- POST /: "Creates report with req.user.id as owner. Duplicate week → 11000 error → friendly message."
- PUT/DELETE /:id: "Find by id, check owner or manager, then update/delete. Members can only touch their own."

### Dashboard — `routes/dashboard.js`
- "GET /summary?weekStart=... Members filtered to own, managers see all."
- "Computes totalReports, totalHours (reduce), totalMembers, hoursByUser grouped per person, recent last 5."
- "Frontend draws bars with plain divs — width % = hours / maxHours."

### Frontend — `src/`
- `api/client.js`: "One axios instance, baseURL /api, interceptor adds Bearer token from localStorage."
- `auth/AuthContext.jsx`: "Context holds {user, login, register, logout}. login/register save token + setUser. On reload, useEffect calls /auth/me to restore."
- `components/ProtectedRoute.jsx`: "If loading show Loading, if no user go /login, if managerOnly and role is member go /reports. Admins pass everywhere managers do."
- `components/StatusBadge.jsx`: "Tiny reusable pill — same colors on every page so status is always readable."
- `pages/MyReports.jsx` (personal report page): "Form with fixed structure + category dropdown + validation (required fields, hours 0–168). Save creates a draft; Submit sends it for review. Edit only allowed on draft/needs-correction."
- `pages/History.jsx`: "Read-only archive with status + week filters, links to detail."
- `pages/ReportDetail.jsx`: "Read-only view by id: content, manager comments with author names, version history list."
- `pages/ManagerReview.jsx` (manager/admin): "Queue of submitted reports, filter by member + week. Approve takes an optional note; Request changes REQUIRES a comment — frontend blocks empty, backend 400s it too."
- `pages/Categories.jsx` (manager/admin): "CRUD table. Delete button only rendered for admins AND backend requireAdmin rejects others — I enforce on both sides."
- `pages/TeamDashboard.jsx`: "GETs /dashboard/summary with week+status filters. Stat cards, Recharts BarChart (hours by person) and PieChart (byStatus object converted to [{name, value}]), recent list. Charts wrapped in ResponsiveContainer with fixed-height divs."
- `App.jsx`: "BrowserRouter + AuthProvider + Navbar + 8 Routes. /review and /categories wrapped in ProtectedRoute managerOnly. Navbar links are role-based."

### Backend — workflow edition
- Report: "Adds status enum (draft/submitted/needs-correction/approved, default draft), optional category ref, comments[] {by, text, at}, versions[] snapshots. Unique index (user, weekStart) still stops duplicates."
- "PUT saves the OLD content into versions[] first (capped at 20), then overwrites — that's the whole version-history trick."
- "Transitions are separate POST endpoints so rules are obvious: submit (owner, from draft/correction), approve (manager, from submitted, optional note), request-changes (manager, from submitted, text required). Wrong state → 400, wrong person → 403."
- Categories: "POST/PUT need manager+, DELETE needs admin — requireRole/requireManager/requireAdmin middleware."
- Dashboard: "Adds byStatus counts for the pie chart; members auto-filtered to own data."

## 3. Practice: likely "add a feature" tasks + how to do them

### A. Add search by text (easiest — practice this first)
Backend `routes/reports.js` GET, after weekStart filter add:
```js
if (req.query.search) {
  const q = req.query.search;
  filter.$or = [
    { done: { $regex: q, $options: 'i' } },
    { plan: { $regex: q, $options: 'i' } },
  ];
}
```
Frontend `MyReports.jsx`: add `const [search, setSearch] = useState('')`, input + include in URL: `/reports?search=${search}`.

### B. Add status field (e.g. on-track / delayed)
1. `models/Report.js`: add `status: { type: String, enum: ['on-track','delayed','done'], default: 'on-track' }`
2. `routes/reports.js` PUT: `if (status !== undefined) report.status = status;`
3. `MyReports.jsx` form: add `<select>` for status, show it in list.

### C. Managers-only page
Use `<ProtectedRoute managerOnly>` in App.jsx for a new route, e.g. `/team`. Say: "ProtectedRoute already supports managerOnly — I reuse it."

### D. Sort / filter by hours
Backend: `if (req.query.minHours) filter.hours = { $gte: Number(req.query.minHours) };`
Frontend: number input for minHours.

### E. "What if token expires?"
Answer: "JWT has expiresIn 7d. Interceptor sends it; backend returns 401; frontend clears token and ProtectedRoute sends user to /login. I can show /auth/me failing in Network tab."

## 4. Viva questions they may ask (with one-line answers)
- JWT vs sessions? → "JWT is stateless, stored in localStorage, sent as Bearer header. No server session needed."
- Why bcrypt? → "One-way hash. Even if DB leaks, passwords aren't readable. compare() checks login."
- Why unique index (user, weekStart)? → "Prevents duplicate weekly submissions at DB level, not just UI."
- Member vs manager enforcement? → "Both: frontend hides links AND backend checks req.user.role on every route."
- Populate? → "Replaces user ObjectId with {name, email} so frontend can show 'By X' without a second query."
- CORS? → "Lets Vite :5173 call Express :5000 in dev. express.json() parses JSON bodies."
- Proxy /api? → "vite.config proxies /api to :5000 so browser avoids CORS/absolute URLs and preview works."

## 5. Your 5-day plan (today Sept 3 → Sept 8)
- **Sept 3–4:** Run it locally, register manager + member, submit 2–3 reports. Read backend files top-to-bottom once.
- **Sept 5:** Read frontend files. Practice the 60-sec speech out loud 3 times.
- **Sept 6:** Do practice task A (search) from scratch without looking. Then task B.
- **Sept 7:** Full mock: explain every file to a friend / mirror in 10 min, then add a feature live in 20 min.
- **Sept 8:** `npm run seed` for clean demo data. Demo path: login as member → submit report → login as manager → show dashboard.

## AI feature (how to explain it)
- `backend/ai.js`: "One helper, no SDK. `askAI(prompt)` POSTs to an OpenAI-compatible `/chat/completions` URL with the key from `.env`, 30s timeout, reply capped at 500 tokens. Throws friendly errors."
- `routes/ai.js`: "`GET /status` tells the frontend to hide AI buttons when no key. `POST /polish` fixes one text field (max 2000 chars). `POST /insights` loads reports with the SAME visibility rule as the dashboard, builds a prompt, returns bullets."
- "The key NEVER reaches the browser — frontend only calls our `/api/ai/*`, the backend attaches the key."
- "No key? App still works: buttons hidden, API replies 503. `.env` is gitignored so the key can't leak to GitHub."
- Viva extras: cost control = max_tokens + input caps (2000 chars, 10 reports); switching provider = only `.env` values change, zero code change.

## Demo accounts (after `npm run seed` in backend/)
- manager@demo.com / manager123
- member@demo.com / member123
