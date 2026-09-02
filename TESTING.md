# Authentication & Role-Based Access Testing Guide

## Overview

This document provides step-by-step instructions to test the authentication and role-based access control (RBAC) system implemented in the Weekly Report Dashboard.

## Prerequisites

- Backend should be running on `http://localhost:5000`
- Frontend should be running on `http://localhost:5173`
- MongoDB should be running at `mongodb://localhost:27017/weekly-report`
- Both `.env` files should be configured with proper values

## Backend Setup

### 1. Configure Environment Variables

**Backend (.env file in backend/ directory):**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/weekly-report
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### 2. Start the Backend Server

```bash
cd backend
npm start
```

Expected output:
```
Connected to MongoDB
Server is running on port 5000
```

## Frontend Setup

### 1. Start the Frontend Dev Server

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Testing Scenarios

### Test 1: User Registration with Different Roles

#### Steps:
1. Open `http://localhost:5173/register` in your browser
2. Create first user (Team Member):
   - **Username:** john_doe
   - **Email:** john@example.com
   - **Password:** password123
   - **Role:** Team Member
   - Click "Register"

3. You should be redirected to the dashboard
4. Verify user info is displayed correctly:
   - Username: john_doe
   - Role: TeamMember
   - "Team Member Section" should be visible
   - Manager and Admin sections should NOT be visible

5. Click "Logout" to return to login page

#### Expected Result:
✅ User is registered and redirected to dashboard with correct role

---

### Test 2: Register Manager User

#### Steps:
1. Click "Register here" link on login page
2. Create second user (Manager):
   - **Username:** jane_smith
   - **Email:** jane@example.com
   - **Password:** password123
   - **Role:** Manager
   - Click "Register"

3. Verify on dashboard:
   - Username: jane_smith
   - Role: Manager
   - "Manager Only Section" should be visible
   - Admin section should NOT be visible
   - Team Member section should NOT be visible

4. Click "Logout"

#### Expected Result:
✅ Manager user is created with appropriate role-based visibility

---

### Test 3: Login with Registered Users

#### Steps:
1. On login page, enter:
   - **Email:** john@example.com
   - **Password:** password123
   - Click "Login"

2. Dashboard should load with John's profile
3. Click "Logout"

4. Try logging in with wrong password:
   - **Email:** john@example.com
   - **Password:** wrongpassword
   - Click "Login"

5. Should see error message: "Invalid credentials"

#### Expected Result:
✅ Login works with correct credentials and fails with invalid ones

---

### Test 4: Role-Based Access Control

#### Scenario A: Team Member Access Restrictions

Steps:
1. Login as john_doe (Team Member)
2. Verify visible sections:
   - ✅ Team Member Section visible
   - ✅ Access buttons: "Submit Report", "View My Reports"
   - ❌ Manager section NOT visible
   - ❌ Admin section NOT visible

#### Scenario B: Manager Access

Steps:
1. Click "Logout"
2. Login as jane_smith (Manager)
3. Verify visible sections:
   - ✅ Manager Section visible
   - ✅ Access buttons: "View Reports", "Manage Team"
   - ✅ Team Member section visible (managers see all)
   - ❌ Admin section NOT visible

#### Expected Result:
✅ Each role only sees appropriate sections and features

---

### Test 5: Protected Routes (No Direct URL Access)

#### Steps:
1. Open a new browser tab (clear all cookies/storage)
2. Manually type `http://localhost:5173/dashboard` and press Enter
3. Should be redirected to `/login` page

#### Expected Result:
✅ Cannot access protected routes without authentication

---

### Test 6: JWT Token Management

#### Steps:
1. Login as john_doe
2. Open browser DevTools (F12 → Application → Local Storage)
3. Verify:
   - `token` key contains the JWT token
   - `user` key contains user data (username, email, role)

4. Close the browser (or clear all tabs)
5. Open the app again at `http://localhost:5173/`
6. Should still be logged in (token persisted in localStorage)

#### Expected Result:
✅ JWT token and user data persist across browser sessions

---

### Test 7: Token Expiration (Manual Test)

#### Steps:
1. Login as any user
2. Wait for JWT token to expire (configured for 7 days by default)
   - For immediate testing, modify backend auth route to use shorter expiration
   - Change `{ expiresIn: '7d' }` to `{ expiresIn: '10s' }` temporarily
3. After token expires, try clicking any dashboard button
4. Should be redirected to login page

#### Expected Result:
✅ Expired tokens are detected and user is logged out

---

### Test 8: Password Validation

#### Steps:
1. Go to `/register`
2. Try to register with:
   - **Username:** testuser
   - **Email:** test@example.com
   - **Password:** 123 (less than 6 characters)
   - Should see error: "Password must be at least 6 characters"

3. Try with mismatched confirm password:
   - **Password:** password123
   - **Confirm Password:** password456
   - Should see error: "Passwords do not match"

#### Expected Result:
✅ Client-side validation prevents invalid submissions

---

### Test 9: Email Uniqueness

#### Steps:
1. Try to register with an email that already exists
2. Fill in form with:
   - **Username:** different_user
   - **Email:** john@example.com (already registered)
   - **Password:** password123
   - Click "Register"

3. Should see backend error: "User already exists"

#### Expected Result:
✅ Duplicate email registration is prevented

---

### Test 10: Backend API Testing (Optional - Using Curl/Postman)

#### Test Register Endpoint

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "TeamMember"
  }'
```

Expected Response:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "TeamMember"
  }
}
```

#### Test Login Endpoint

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Test Protected Route (/me endpoint)

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

Expected Response:
```json
{
  "user": {
    "id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "TeamMember"
  }
}
```

#### Test Without Token (should fail)

```bash
curl -X GET http://localhost:5000/api/auth/me
```

Expected Response:
```json
{
  "message": "No token provided, authorization denied"
}
```

---

## Troubleshooting

### Issue: "Cannot POST /api/auth/register"
**Solution:** 
- Verify backend is running on port 5000
- Check that auth routes are properly imported in backend/index.js
- Restart backend server

### Issue: "MongoDB connection error"
**Solution:**
- Ensure MongoDB is running locally or update MONGODB_URI in .env
- Check connection string in .env file

### Issue: "Cannot find module" errors
**Solution:**
- Ensure all packages are installed: `npm install`
- Check that import paths are correct
- For frontend, verify imports use `.jsx` extension

### Issue: Frontend not connecting to backend
**Solution:**
- Check CORS is enabled in backend (it is by default)
- Verify axios baseURL in frontend/src/api.js is correct
- Check browser console for CORS errors

### Issue: Token not being sent in requests
**Solution:**
- Check that axios interceptor is properly configured
- Verify token is stored in localStorage after login
- Check browser DevTools Network tab to see request headers

---

## Summary Checklist

- [ ] Test 1: User Registration ✓
- [ ] Test 2: Manager Registration ✓
- [ ] Test 3: Login & Logout ✓
- [ ] Test 4: Role-Based Access ✓
- [ ] Test 5: Protected Routes ✓
- [ ] Test 6: Token Persistence ✓
- [ ] Test 7: Token Expiration (Optional) ✓
- [ ] Test 8: Password Validation ✓
- [ ] Test 9: Email Uniqueness ✓
- [ ] Test 10: Backend API (Optional) ✓

Once all tests pass, your authentication and RBAC system is fully functional!
