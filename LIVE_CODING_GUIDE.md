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
- `components/ProtectedRoute.jsx`: "If loading show Loading, if no user go /login, if managerOnly and not manager go /reports."
- `pages/MyReports.jsx`: "useState for list + form + filter + editingId. load() GETs /reports. Submit POSTs or PUTs. Edit fills form, Delete confirms then DELETEs."
- `pages/TeamDashboard.jsx`: "GETs /dashboard/summary, shows 3 stat cards, bars, recent list."
- `App.jsx`: "BrowserRouter + AuthProvider + Navbar + Routes. /reports and /dashboard wrapped in ProtectedRoute."

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

## Demo accounts (after `npm run seed` in backend/)
- manager@demo.com / manager123
- member@demo.com / member123
