# Weekly Report Dashboard

A full-stack web application for managing weekly team reports with role-based access, review workflows, and analytics dashboards.

## Table of Contents

- [Project Overview](#project-overview)
- [Features Implemented](#features-implemented)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [API Reference](#api-reference)
- [Frontend Pages](#frontend-pages)
- [Workflows](#workflows)
- [Setup Instructions](#setup-instructions)
- [Demo Data](#demo-data)
- [Hosting on Vercel & Render](#hosting-on-vercel--render)
- [Technology Stack](#technology-stack)

---

## Project Overview

The Weekly Report Dashboard enables teams to create, submit, and review structured weekly reports. It supports three user roles — Team Member, Manager, and Admin — with appropriate access controls. Managers can review reports, approve them, or request corrections. Admins manage users, categories, and projects. The dashboard provides visual insights into team productivity, compliance rates, and workload distribution.

---

## Features Implemented

### Authentication & Role-based Access
- User registration with name, email, password, and role selection
- Secure login/logout with JWT tokens
- Password hashing using bcrypt (10 rounds)
- Role-based UI and route protection: `member`, `manager`, `admin`
- Session persistence via localStorage with auto-logout on token expiry (401)

### Personal Weekly Report Page
- Structured report form with fixed fields:
  - Week start date (Monday)
  - Category / project tag
  - Tasks completed (done)
  - Planned tasks
  - Blockers
  - Achievements
  - Hours worked
  - Notes / links
- Draft save, edit, and submit functionality
- Report history list with status badges:
  - Draft
  - Submitted
  - Needs Correction
  - Approved

### Report Review & Correction Workflow
- Manager can approve submitted reports with optional comments
- Manager can request changes with required correction comments
- Status flow: `Draft → Submitted → Needs Correction → Submitted → Approved`
- Team members can edit and resubmit reports marked for correction
- Version history saved on every edit with timestamps
- Comment trail on reports showing manager feedback

### Team Dashboard (Manager View)
- View all team reports for a selected week
- Filter by:
  - Team member
  - Category / project
  - Date range (week start to week end)
  - Submission status
- Open reports for review actions
- Metrics displayed:
  - Total reports submitted
  - Compliance rate
  - Correction count
  - Blockers count
  - Total hours worked
  - Member count
- Charts and visualizations:
  - Submission/approval status breakdown (pie chart)
  - Tasks trend over weeks (bar chart)
  - Workload distribution by person (bar chart)
  - Time spent by task type / category (bar chart)
  - Recent activity feed

### Projects / Categories Management
- Create, edit, and delete categories
- Create, edit, and delete projects
- Assign team members to projects
- Categories used as tags in report forms
- Projects with member lists for team organization

### Additional Pages (10 total)
1. Login
2. Register
3. My Reports (personal report history + create/edit)
4. Report Detail (read-only with comments and version history)
5. Team Dashboard (analytics and charts)
6. Categories Management
7. Projects Management
8. Users Management (admin only)
9. Manager Review Page (queue of submitted reports)
10. Team Member Profiles (manager view)

### Deliverables Status
- GitHub repo: ✅ Available with frontend + backend + README
- ER diagram: ❌ Not created yet (README provides schema for AI generation)
- Presentation: ❌ Not created yet
- Demo video: ❌ Not created yet

---

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Frontend │────▶│  Express Backend│────▶│   MongoDB       │
│   (Vite + React)│     │   (Node.js)     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │   REST API / JSON     │   Mongoose ODM        │
         │◀─────────────────────│◀─────────────────────│
         │                       │                       │
```

### Frontend Architecture
- Single Page Application (SPA) using React 19 and React Router v7
- Context API for global auth state (`AuthContext`)
- Axios instance with request interceptor for JWT attachment
- Role-aware navigation and route protection
- Responsive CSS with plain styles (no framework)

### Backend Architecture
- Express.js REST API with modular route files
- Mongoose models for data persistence
- JWT-based authentication middleware
- Role-based access control middleware (`requireManager`, `requireAdmin`)
- Seed script for demo data

---

## Database Design

### Users Collection
Stores user accounts with role-based access.

```
User {
  _id: ObjectId
  name: String (required, unique per user)
  email: String (required, unique, lowercase, trimmed)
  password: String (required, bcrypt hashed)
  role: String (enum: "member" | "manager" | "admin", default: "member")
  createdAt: Date
  updatedAt: Date
}
```

### Categories Collection
Project/category tags used in reports.

```
Category {
  _id: ObjectId
  name: String (required, unique, trimmed)
  description: String (default: "")
  createdAt: Date
  updatedAt: Date
}
```

### Projects Collection
Projects with assigned team members.

```
Project {
  _id: ObjectId
  name: String (required, unique, trimmed)
  description: String (default: "")
  members: [ObjectId] (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

### Reports Collection
Weekly reports with workflow status and review history.

```
Report {
  _id: ObjectId
  user: ObjectId (ref: User, required)
  category: ObjectId (ref: Category, default: null)
  weekStart: String (required, format: YYYY-MM-DD)
  done: String (required)
  plan: String (required)
  blockers: String (default: "")
  achievements: String (default: "")
  notes: String (default: "")
  hours: Number (required, min: 0, max: 168)
  status: String (enum: "draft" | "submitted" | "needs-correction" | "approved", default: "draft")
  comments: [
    {
      by: ObjectId (ref: User)
      text: String (required)
      at: Date (default: Date.now)
    }
  ]
  versions: [
    {
      done: String
      plan: String
      blockers: String
      achievements: String
      notes: String
      hours: Number
      at: Date (default: Date.now)
    }
  ]
  createdAt: Date
  updatedAt: Date
}

Indexes:
- { user: 1, weekStart: 1 } (unique) — one report per user per week
```

### Relationships

```
User (1) ────< (N) Report
User (N) ────< (N) Project (members array)
Category (1) ───< (N) Report

User (1) ────< (N) Comment (through Report.comments.by)
```

### Entity-Relationship Summary for AI Diagram Generation

**Entities:**
1. **User** — id, name, email, password, role (member/manager/admin), timestamps
2. **Category** — id, name, description, timestamps
3. **Project** — id, name, description, members[], timestamps
4. **Report** — id, user_id, category_id, weekStart, done, plan, blockers, achievements, notes, hours, status, comments[], versions[], timestamps

**Relationships:**
- User to Report: one-to-many (a user writes many reports)
- Category to Report: one-to-many (a category tags many reports)
- User to Project: many-to-many (users assigned to projects via members array)
- User to Comment: one-to-many (a user writes many comments)

**Enums:**
- User.role: `member`, `manager`, `admin`
- Report.status: `draft`, `submitted`, `needs-correction`, `approved`

---

## API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user `{ name, email, password, role? }` |
| POST | `/api/auth/login` | No | Login `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | Yes | Get current user profile |
| GET | `/api/auth/users` | Manager+ | List all users |
| PUT | `/api/auth/users/:id` | Admin | Update user role |

### Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reports` | Yes | List reports (members: own, managers: all). Filters: `weekStart`, `status`, `category`, `user` |
| GET | `/api/reports/:id` | Yes | Get report detail |
| POST | `/api/reports` | Yes | Create draft report `{ weekStart, done, plan, blockers?, achievements?, notes?, hours, category? }` |
| PUT | `/api/reports/:id` | Yes | Edit report (owner: draft/correction, manager: any) |
| POST | `/api/reports/:id/submit` | Owner | Submit report for review |
| POST | `/api/reports/:id/approve` | Manager+ | Approve report `{ text? }` |
| POST | `/api/reports/:id/request-changes` | Manager+ | Request changes `{ text }` |
| DELETE | `/api/reports/:id` | Yes | Delete report (owner: draft/correction, manager: any) |
| GET | `/api/reports/manager/all` | Manager+ | All reports with filters: `user`, `category`, `status`, `weekStart`, `weekEnd` |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/summary` | Yes | Summary metrics: totalReports, totalHours, totalMembers, byStatus, blockersCount, correctionCount, complianceRate, hoursByUser, hoursByCategory, recent |
| GET | `/api/dashboard/trend?weeks=N` | Yes | Weekly report count trend for last N weeks |

### Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | Yes | List all categories |
| POST | `/api/categories` | Manager+ | Create category `{ name, description? }` |
| PUT | `/api/categories/:id` | Manager+ | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category |

### Projects
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects` | Yes | List all projects with members |
| POST | `/api/projects` | Manager+ | Create project `{ name, description?, members? }` |
| PUT | `/api/projects/:id` | Manager+ | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |

---

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page with quick links |
| `/login` | Login | Email/password login form |
| `/register` | Register | Account creation with role selection |
| `/reports` | My Reports | Personal report list, create/edit form, week filter, submit/delete actions |
| `/reports/:id` | Report Detail | Read-only report view with comments and version history |
| `/dashboard` | Team Dashboard | Analytics: stats cards, status pie, trend chart, workload bars, recent activity |
| `/categories` | Categories | CRUD for report categories (manager/admin) |
| `/projects` | Projects | CRUD for projects with member assignment (manager/admin) |
| `/users` | Users | User list and role management (admin only) |
| `/review` | Review Page | Manager queue of submitted reports with approve/request-changes |
| `/profiles` | Profiles | Manager view of team member profiles and their reports |
| `/reports/manage` | All Reports | Manager report explorer with filters: member, category, status, date range |

---

## Workflows

### Report Submission Workflow
1. Team Member creates a draft report with weekly details
2. Team Member edits draft as needed
3. Team Member submits report for review
4. Manager reviews submitted report
5. Manager either:
   - Approves report → status becomes `approved`
   - Requests changes → status becomes `needs-correction` with comment
6. If needs correction:
   - Team Member edits report
   - Team Member resubmits
   - Version history preserved
7. Manager approves final version

### Manager Review Workflow
1. Manager navigates to Review Page or All Reports
2. Manager sees all submitted reports across the team
3. Manager can filter by team member, category, date range, status
4. Manager opens report detail
5. Manager adds comment and approves or requests changes
6. Team Member notified via status change

### Dashboard Analytics
- Compliance rate = (approved + submitted reports) / total members × 100
- Trend chart shows report submission volume over recent weeks
- Workload distribution shows hours worked per team member
- Status breakdown shows report states at a glance

---

## Setup Instructions

### Prerequisites
- Node.js v16+
- npm v8+
- MongoDB (local or Atlas)

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

```bash
# Backend environment variables
cp backend/.env.example backend/.env

# Example .env contents:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/weekly-report
# JWT_SECRET=your_jwt_secret_here
```

### Running the Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:5000

### Seeding Demo Data

```bash
cd backend
npm run seed
```

Demo accounts:
- `member@demo.com` / `member123` — Team Member
- `manager@demo.com` / `manager123` — Manager
- `admin@demo.com` / `admin123` — Admin

---

## Technology Stack

### Frontend
- React 19
- React Router v7
- Vite 8
- Axios
- Plain CSS (no framework)

### Backend
- Node.js
- Express.js 4
- MongoDB 8+ (Mongoose)
- JWT (jsonwebtoken)
- bcryptjs
- CORS
- Dotenv
- Nodemon (dev)

---

## Hosting on Vercel & Render

This project is configured for Vercel (frontend) and Render (backend) deployment.

### Frontend on Vercel

A `vercel.json` file at the project root handles the Vite build and SPA routing.

**Steps:**
1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Import the GitHub repository
3. Vercel uses `vercel.json` to install and build the `frontend` app
4. In **Settings → Environment Variables**, set `VITE_API_URL` to `https://YOUR-RENDER-SERVICE.onrender.com/api` for Production, Preview, and Development
5. Deploy

**vercel.json** (already included):
```json
{
  "installCommand": "cd frontend && npm ci",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

The SPA rewrite keeps direct links such as `/reports` working. The frontend reads `VITE_API_URL` during the Vercel build to call the Render API.

### Backend on Render

The root `render.yaml` Blueprint defines the web service and sets `backend/` as its root directory.

**Steps:**
1. Create a Render account at [render.com](https://render.com)
2. Create a new Web Service
3. Choose **New → Blueprint** and select the repository
4. Set environment variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long random secret
   - `FRONTEND_URL` — your Vercel URL, for example `https://your-app.vercel.app`
   - `NODE_ENV=production`
5. Deploy

**render.yaml** (included at the repository root):
```yaml
services:
  - type: web
    runtime: node
    rootDir: backend
    buildCommand: npm ci
    startCommand: npm start
```

### Environment Variables

**Vercel (Frontend):**
- `VITE_API_URL` — Your Render API URL (e.g. `https://your-backend.onrender.com/api`)

**Render (Backend):**
- `PORT` — Port the server listens on (default: 5000)
- `MONGODB_URI` — MongoDB connection string (use Atlas for production)
- `JWT_SECRET` — Secret key for JWT signing
- `FRONTEND_URL` — Comma-separated allowed browser origins, including your Vercel URL
- `NODE_ENV` — Set to `production`

### MongoDB

Use MongoDB Atlas for production:
1. Create a cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Set it as `MONGODB_URI` in Render environment variables
4. Run `npm run seed` once after deployment to populate demo data

### Workflow

1. Push code to GitHub
2. Both Vercel and Render auto-deploy on push
3. Frontend serves from `your-app.vercel.app`
4. Backend API serves from `your-backend.onrender.com`
5. API requests from the frontend go directly to Render using `VITE_API_URL`

---

## Project Structure

```
weekly-report-dashboard/
├── backend/
│   ├── index.js              # Express app entry point
│   ├── seed.js               # Demo data seeder
│   ├── middleware/
│   │   └── auth.js           # JWT auth + role guards
│   ├── models/
│   │   ├── User.js           # User schema
│   │   ├── Report.js         # Report schema with comments/versions
│   │   ├── Category.js       # Category schema
│   │   └── Project.js        # Project schema with members
│   └── routes/
│       ├── auth.js           # Register, login, me, users
│       ├── reports.js        # Report CRUD + workflow actions
│       ├── dashboard.js      # Summary + trend analytics
│       ├── categories.js     # Category CRUD
│       └── projects.js       # Project CRUD
├── frontend/
│   ├── src/
│   │   ├── main.jsx          # React entry point
│   │   ├── App.jsx           # Routes + layout
│   │   ├── api/
│   │   │   └── client.js     # Axios instance
│   │   ├── auth/
│   │   │   └── AuthContext.jsx # Auth state provider
│   │   ├── components/
│   │   │   ├── Navbar.jsx    # Role-aware navigation
│   │   │   └── ProtectedRoute.jsx # Auth guard
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── MyReports.jsx
│   │   │   ├── ReportDetail.jsx
│   │   │   ├── TeamDashboard.jsx
│   │   │   ├── Categories.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── ReviewPage.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── ManagerReports.jsx
│   │   └── index.css         # Global styles
│   └── vite.config.js        # Vite config with API proxy
└── README.md                 # This file
```

---

## Database Schema Details

### User Model
- `name`: Full name of the user
- `email`: Unique email address (lowercase, trimmed)
- `password`: Bcrypt-hashed password
- `role`: One of `member`, `manager`, `admin`
- `timestamps`: `createdAt`, `updatedAt`

### Report Model
- `user`: Reference to author (User)
- `category`: Optional reference to Category
- `weekStart`: Monday date of the report week (YYYY-MM-DD)
- `done`: Tasks completed this week
- `plan`: Planned tasks for next week
- `blockers`: Any blockers or impediments
- `achievements`: Key achievements or highlights
- `notes`: Additional notes or links
- `hours`: Total hours worked (0-168)
- `status`: Workflow state
- `comments`: Array of manager feedback with author and timestamp
- `versions`: Array of previous report snapshots for version history
- `timestamps`: `createdAt`, `updatedAt`
- **Unique index**: `{ user, weekStart }` — one report per user per week

### Category Model
- `name`: Unique category name
- `description`: Optional description
- `timestamps`

### Project Model
- `name`: Unique project name
- `description`: Project description
- `members`: Array of User references
- `timestamps`

---

## Key Workflows

### 1. Report Lifecycle
```
Draft → Submitted → Needs Correction → Submitted → Approved
```

### 2. Permission Matrix
| Action | Member | Manager | Admin |
|--------|--------|---------|-------|
| Create/edit own reports | ✅ | ✅ | ✅ |
| Submit own reports | ✅ | ✅ | ✅ |
| View own reports | ✅ | ✅ | ✅ |
| View all team reports | ❌ | ✅ | ✅ |
| Approve reports | ❌ | ✅ | ✅ |
| Request changes | ❌ | ✅ | ✅ |
| Manage categories | ❌ | ✅ | ✅ |
| Delete categories | ❌ | ❌ | ✅ |
| Manage projects | ❌ | ✅ | ✅ |
| Delete projects | ❌ | ❌ | ✅ |
| Manage users/roles | ❌ | ❌ | ✅ |

### 3. Data Flow
1. Frontend sends JWT in `Authorization: Bearer <token>` header
2. Backend middleware verifies token and attaches `req.user`
3. Role middleware checks permissions for protected routes
4. Mongoose queries fetch/persist data with population for references
5. Frontend receives JSON and updates React state

---

## Demo Data

Run `npm run seed` in the `backend/` directory to populate:
- 3 demo users (member, manager, admin)
- 3 categories (Development, Design, Testing)
- 3 projects with member assignments
- 4 sample reports in different workflow states:
  - Approved report with manager comment and version history
  - Submitted report pending review
  - Draft report in progress
  - Manager's own submitted report

---

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here]
