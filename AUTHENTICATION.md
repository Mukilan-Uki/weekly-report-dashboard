# Authentication & Authorization Implementation Guide

## Overview

This guide explains how the authentication and role-based access control (RBAC) system has been implemented in the Weekly Report Dashboard.

## Backend Components

### 1. User Model (`backend/models/User.js`)

The User model defines the structure for user data:

```javascript
- username: String (required, unique)
- email: String (required, unique)
- password: String (required, hashed)
- role: String (enum: 'TeamMember', 'Manager', 'Admin')
- timestamps: auto-managed (createdAt, updatedAt)
```

**Key Features:**
- Passwords are automatically hashed using bcryptjs before saving
- `comparePassword()` method verifies passwords during login
- Email validation using regex pattern

### 2. Authentication Middleware (`backend/middleware/authMiddleware.js`)

Protects routes by verifying JWT tokens:
- Extracts token from Authorization header
- Handles 'Bearer ' prefix
- Verifies JWT signature and expiration
- Attaches user info to `req.user`
- Returns 401 error if token is invalid or missing

**Usage:**
```javascript
router.get('/protected-route', authMiddleware, (req, res) => {
  // req.user contains {id, email, role}
});
```

### 3. Role Middleware (`backend/middleware/roleMiddleware.js`)

Checks if user has required role:
- Should be used AFTER authMiddleware
- Accepts array or single role
- Returns 403 Forbidden if role doesn't match
- Provides clear error message about required roles

**Usage:**
```javascript
router.delete('/admin-route', authMiddleware, roleMiddleware('Admin'), (req, res) => {
  // Only Admin can access
});

router.get('/management', authMiddleware, roleMiddleware(['Manager', 'Admin']), (req, res) => {
  // Both Manager and Admin can access
});
```

### 4. Auth Routes (`backend/routes/authRoutes.js`)

Three main endpoints:

#### POST /api/auth/register
- Accepts: `username`, `email`, `password`, `role`
- Checks for existing user (email or username)
- Creates new user with hashed password
- Returns JWT token and user data
- Default role: 'TeamMember' if not specified

#### POST /api/auth/login
- Accepts: `email`, `password`
- Validates credentials against stored hash
- Returns JWT token (valid for 7 days) and user data

#### GET /api/auth/me (Protected)
- Requires valid JWT token
- Returns current authenticated user's data
- Useful for frontend verification

## Frontend Components

### 1. Axios API Instance (`frontend/src/api.js`)

Configured axios with interceptors:
- **Request Interceptor:** Automatically adds JWT token to Authorization header
- **Response Interceptor:** Detects 401 errors and redirects to login
- **Base URL:** `http://localhost:5000/api`

All API calls made with this instance will automatically include the token.

### 2. Auth Context (`frontend/src/context/AuthContext.jsx`)

Centralized authentication state management:

**State Variables:**
- `user`: Current user object
- `isAuthenticated`: Boolean indicating login status
- `loading`: Boolean for initial load check
- `error`: Error message from last authentication attempt

**Methods:**
- `register(username, email, password, role)`: Create new user
- `login(email, password)`: Authenticate user
- `logout()`: Clear session and storage
- `hasRole(requiredRoles)`: Check if user has required role(s)

**Features:**
- Persists token and user data in localStorage
- Restores session on app reload
- Provides `useAuth()` hook for component access

### 3. Login Page (`frontend/src/pages/Login.jsx`)

- Email and password form
- Client-side validation
- Display error messages
- Loading state during submission
- Link to register page
- Redirects to dashboard on success

### 4. Register Page (`frontend/src/pages/Register.jsx`)

- Username, email, password, role selection
- Password confirmation validation
- Role dropdown (TeamMember, Manager, Admin)
- Client-side validation
- Display error messages
- Redirects to dashboard on success

### 5. ProtectedRoute Component (`frontend/src/components/ProtectedRoute.jsx`)

Restricts access to routes:
- Checks if user is authenticated
- Shows loading state while checking auth
- Redirects to login if not authenticated
- Optionally checks for required roles
- Shows "Access Denied" message if role doesn't match

**Usage:**
```javascript
// Protect route for any authenticated user
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Protect route for specific role
<Route path="/admin" element={
  <ProtectedRoute requiredRoles="Admin">
    <AdminPanel />
  </ProtectedRoute>
} />

// Allow multiple roles
<Route path="/management" element={
  <ProtectedRoute requiredRoles={['Manager', 'Admin']}>
    <ManagementPanel />
  </ProtectedRoute>
} />
```

### 6. Dashboard Page (`frontend/src/pages/Dashboard.jsx`)

- Displays current user info and role
- Shows role-specific sections
- TeamMember: Submit/View reports
- Manager: View reports, manage team
- Admin: User management, system settings
- Logout functionality

## Authentication Flow

### Registration Flow

```
User fills register form
    ↓
Client validates input
    ↓
POST /api/auth/register (username, email, password, role)
    ↓
Backend checks for existing user
    ↓
Backend hashes password
    ↓
Backend saves user to MongoDB
    ↓
Backend generates JWT token
    ↓
Backend returns token + user data
    ↓
Frontend stores token in localStorage
    ↓
Frontend stores user in localStorage
    ↓
Frontend redirects to dashboard
```

### Login Flow

```
User fills login form
    ↓
Client validates input
    ↓
POST /api/auth/login (email, password)
    ↓
Backend finds user by email
    ↓
Backend compares password hash
    ↓
Backend generates JWT token (7 day expiration)
    ↓
Backend returns token + user data
    ↓
Frontend stores token & user
    ↓
Frontend redirects to dashboard
```

### Protected API Call Flow

```
Frontend wants to access protected resource
    ↓
Axios interceptor adds token to Authorization header
    ↓
Request: GET /api/protected-route
Header: "Authorization: Bearer <token>"
    ↓
Backend authMiddleware validates token
    ↓
Backend checks expiration
    ↓
If valid: attach user to req.user, continue
    ↓
If invalid: return 401 Unauthorized
    ↓
Frontend response interceptor detects 401
    ↓
Clear localStorage and redirect to login
```

## Role-Based Access Control (RBAC) Strategy

### Three Roles

1. **TeamMember** (Default)
   - Can submit personal reports
   - Can view own reports
   - Limited permissions

2. **Manager**
   - Can view team reports
   - Can manage team members
   - Can review submissions
   - Higher permissions than TeamMember

3. **Admin**
   - Full system access
   - Can manage all users
   - Can modify system settings
   - Highest permissions

### Implementation Strategies

#### Strategy 1: Frontend Role Checking

```javascript
const { user, hasRole } = useAuth();

// Show component only if role matches
{hasRole('Manager') && <ManagerPanel />}

// Check multiple roles
{hasRole(['Manager', 'Admin']) && <ManagementTools />}
```

#### Strategy 2: Backend Route Protection

```javascript
// Only Admin can access
router.put('/admin/settings', authMiddleware, roleMiddleware('Admin'), handler);

// Manager or Admin can access
router.get('/reports', authMiddleware, roleMiddleware(['Manager', 'Admin']), handler);

// Any authenticated user can access
router.get('/dashboard', authMiddleware, handler);
```

#### Strategy 3: Conditional Data Access

```javascript
// Return different data based on role
app.get('/api/reports', authMiddleware, (req, res) => {
  if (req.user.role === 'Admin') {
    // Return all reports
  } else if (req.user.role === 'Manager') {
    // Return team reports
  } else {
    // Return own reports only
  }
});
```

## Security Considerations

### 1. Password Security
- Passwords are hashed with bcryptjs (10 salt rounds)
- Never stored in plain text
- Never returned to client

### 2. JWT Token Security
- Stored in browser localStorage (consider httpOnly cookie for production)
- Expires after 7 days
- Validated on every protected request
- Secret key should be strong and kept private

### 3. CORS Protection
- Backend has CORS enabled for localhost:5173
- Should be restricted to production domain in production

### 4. Input Validation
- Frontend validates email format, password length
- Backend validates all inputs
- Backend prevents duplicate emails/usernames

### 5. Authorization Checks
- Every protected route checks JWT
- Every role-restricted route verifies user role
- Frontend cannot bypass backend security

## Environment Variables Required

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/weekly-report
NODE_ENV=development
JWT_SECRET=your_strong_secret_key_here
```

### Frontend
No specific auth variables needed (uses baseURL in api.js)

## Common Patterns

### Logout Implementation

```javascript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  navigate('/login');
};
```

### Checking if User is Logged In

```javascript
const token = localStorage.getItem('token');
const isLoggedIn = !!token;
```

### Getting Current User Info

```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log(user.role); // 'TeamMember', 'Manager', or 'Admin'
```

### Sending API Request with Token

```javascript
// Automatic with axios interceptor
import API from '../api';

API.get('/api/protected-route');
// Token is automatically added to Authorization header
```

## Extending the System

### Adding New Roles

1. Update User model enum in `backend/models/User.js`
2. Update role badges in `frontend/src/styles/Dashboard.css`
3. Add new sections in `frontend/src/pages/Dashboard.jsx`
4. Update backend routes to check for new role

### Adding Protected Routes

1. Backend: `router.get('/route', authMiddleware, roleMiddleware('RequiredRole'), handler)`
2. Frontend: `<ProtectedRoute requiredRoles="RequiredRole"><Component /></ProtectedRoute>`

### Adding JWT Features

- **Token Refresh:** Implement refresh tokens for longer sessions
- **Logout All Devices:** Invalidate all tokens for a user
- **Two-Factor Auth:** Add OTP verification after login
- **Password Reset:** Add forgot password functionality

## Testing

See `TESTING.md` for comprehensive testing guide covering:
- User registration
- Login/logout
- Role-based access
- Protected routes
- Token management
- API testing
