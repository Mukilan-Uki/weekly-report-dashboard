# Authentication System - Quick Start Guide

## What Was Implemented

Your Weekly Report Dashboard now has a complete authentication and role-based access control (RBAC) system:

### Backend (Express + JWT + MongoDB)
- ✅ User model with secure password hashing (bcryptjs)
- ✅ JWT token-based authentication
- ✅ Protected routes with middleware
- ✅ Role-based access control (TeamMember, Manager, Admin)
- ✅ Three endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`

### Frontend (React + Axios)
- ✅ Login and Register pages with validation
- ✅ Auth context for state management
- ✅ Protected routes that check authentication
- ✅ Role-based UI components (show/hide sections based on role)
- ✅ Automatic JWT token handling via axios interceptor
- ✅ Dashboard showing user info and role-specific features

## Quick Start (5 Minutes)

### 1. Setup MongoDB
Choose one option:

**Option A: Local MongoDB**
```bash
# Windows Subsystem for Linux, macOS/Homebrew, or Docker
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Get connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/database`)
4. Update `backend/.env` MONGODB_URI with your connection string

### 2. Configure Environment Variables

**Backend** - Create `backend/.env` file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/weekly-report
NODE_ENV=development
JWT_SECRET=your_super_secret_key_change_this_in_production
```

### 3. Start Backend

```bash
cd backend
npm start
```

Expected output:
```
Connected to MongoDB
Server is running on port 5000
```

### 4. Start Frontend (in new terminal)

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Testing the System

### Quick Manual Test (2 Minutes)

1. **Open App:** http://localhost:5173 (redirects to login)

2. **Register a Team Member:**
   - Click "Register here"
   - Fill in:
     ```
     Username: john_doe
     Email: john@example.com
     Password: password123
     Role: Team Member
     ```
   - Click "Register"
   - Should see dashboard with "Team Member Section"

3. **Logout and Register Manager:**
   - Click "Logout"
   - Click "Register here"
   - Fill in:
     ```
     Username: jane_smith
     Email: jane@example.com
     Password: password123
     Role: Manager
     ```
   - Should see dashboard with "Manager Only Section"

4. **Test Login:**
   - Click "Logout"
   - Enter john@example.com / password123
   - Should log in as Team Member

### Full Test Suite

See **TESTING.md** for 10 comprehensive test scenarios covering:
- Registration with different roles
- Login/logout
- Invalid credentials
- Role-based access restrictions
- Protected routes
- Token persistence
- And more...

## Project Structure

```
weekly-report-dashboard/
├── backend/
│   ├── models/
│   │   └── User.js                 # User schema with password hashing
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verification
│   │   └── roleMiddleware.js       # Role checking
│   ├── routes/
│   │   └── authRoutes.js           # Auth endpoints
│   ├── index.js                    # Main server with MongoDB connection
│   └── .env.example                # Environment template
│
├── frontend/
│   └── src/
│       ├── context/
│       │   └── AuthContext.jsx     # Auth state management
│       ├── pages/
│       │   ├── Login.jsx           # Login form
│       │   ├── Register.jsx        # Registration form
│       │   └── Dashboard.jsx       # Main app (role-specific UI)
│       ├── components/
│       │   └── ProtectedRoute.jsx  # Route protection wrapper
│       ├── styles/
│       │   ├── Auth.css            # Login/Register styles
│       │   └── Dashboard.css       # Dashboard styles
│       ├── api.js                  # Axios with JWT interceptor
│       ├── App.jsx                 # Router configuration
│       └── index.css               # Global styles
│
├── README.md                        # General setup instructions
├── AUTHENTICATION.md               # Implementation details
└── TESTING.md                      # Testing guide
```

## How It Works

### Authentication Flow

```
User Registration/Login
         ↓
Credentials sent to backend
         ↓
Backend validates and hashes password
         ↓
Backend generates JWT token (valid 7 days)
         ↓
Frontend stores token in localStorage
         ↓
Token automatically added to all API requests
         ↓
Backend verifies token on protected routes
         ↓
User gets access if token is valid
```

### Role-Based Access

Three roles with increasing permissions:
- **TeamMember** (default) - Submit personal reports
- **Manager** - View team reports, manage team
- **Admin** - Full system access

Each role sees only its allowed UI sections and can only access its permitted API endpoints.

## Key Features Explained

### 1. Password Security
- Passwords never stored in plain text
- Hashed with bcryptjs (industry standard)
- Cannot be recovered, only verified

### 2. JWT Tokens
- Automatically sent with every API request
- Expires after 7 days
- Invalid if someone tries to modify it
- Automatically refreshed on new login

### 3. Protected Routes
```javascript
// Frontend: Only shows if user is logged in with correct role
<ProtectedRoute requiredRoles="Manager">
  <ManagerPanel />
</ProtectedRoute>

// Backend: Returns 401 if not authenticated, 403 if wrong role
router.get('/manager-data', authMiddleware, roleMiddleware('Manager'), handler);
```

### 4. Token Storage
- Stored in browser's localStorage
- Survives page refresh
- Automatically cleared on 401 error
- Can be manually cleared on logout

## Common Commands

### Backend
```bash
cd backend
npm start          # Start server
npm run dev        # Start with auto-reload (requires nodemon)
```

### Frontend
```bash
cd frontend
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Testing API Endpoints (Using curl/Postman)

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"pass123","role":"TeamMember"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'
```

### Get Current User (requires token)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Environment Variables Checklist

- [ ] Backend `.env` created with JWT_SECRET
- [ ] MONGODB_URI configured (local or Atlas)
- [ ] PORT set to 5000
- [ ] NODE_ENV set to development

## Troubleshooting

### "Cannot connect to MongoDB"
- Check if MongoDB is running
- Update MONGODB_URI in .env
- Restart backend server

### "Token is not valid"
- Clear localStorage: DevTools → Application → Local Storage → Clear All
- Log out and log back in
- Restart frontend dev server

### "CORS error"
- Backend CORS is enabled by default
- Check both servers are running
- Clear browser cache

### "Cannot POST /api/auth/register"
- Backend server running? Check console for "Server is running on port 5000"
- MongoDB connected? Check console for "Connected to MongoDB"

## Next Steps

1. **Read Full Documentation:**
   - See [AUTHENTICATION.md](AUTHENTICATION.md) for implementation details
   - See [TESTING.md](TESTING.md) for complete test scenarios

2. **Run Tests:**
   - Follow steps in TESTING.md
   - Test all 10 scenarios

3. **Extend the System:**
   - Add more user fields (profile picture, bio, etc.)
   - Implement password reset
   - Add email verification
   - Add two-factor authentication
   - Implement refresh tokens for longer sessions

4. **Deploy to Production:**
   - Use strong JWT_SECRET
   - Configure CORS for production domain
   - Use HTTPS
   - Consider httpOnly cookies instead of localStorage
   - Set up proper MongoDB backup

## File Summary

### Backend Files Added/Modified
- `backend/models/User.js` - User data model with password hashing
- `backend/middleware/authMiddleware.js` - JWT verification
- `backend/middleware/roleMiddleware.js` - Role checking
- `backend/routes/authRoutes.js` - Authentication endpoints
- `backend/index.js` - Updated with MongoDB and auth routes
- `backend/.env.example` - Updated environment template
- `backend/package.json` - Added bcryptjs, jsonwebtoken

### Frontend Files Added/Modified
- `frontend/src/context/AuthContext.jsx` - State management
- `frontend/src/pages/Login.jsx` - Login page
- `frontend/src/pages/Register.jsx` - Registration page
- `frontend/src/pages/Dashboard.jsx` - Main dashboard
- `frontend/src/components/ProtectedRoute.jsx` - Route protection
- `frontend/src/api.js` - Axios with JWT interceptor
- `frontend/src/App.jsx` - Updated with routing
- `frontend/src/styles/Auth.css` - Auth page styling
- `frontend/src/styles/Dashboard.css` - Dashboard styling
- `frontend/src/index.css` - Updated global styles
- `frontend/package.json` - Added axios, react-router-dom

### Documentation Added
- `AUTHENTICATION.md` - Complete implementation guide
- `TESTING.md` - Testing scenarios and API examples
- `AUTH_QUICK_START.md` - This file

## Questions?

Refer to:
- **AUTHENTICATION.md** - How everything works
- **TESTING.md** - How to verify it works
- Browser Console - Debug frontend issues
- Terminal Output - Debug backend issues

Good luck! 🚀
