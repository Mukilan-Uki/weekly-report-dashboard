# Code Snippets & Examples

Quick reference for common authentication tasks.

## Backend Code Snippets

### Adding a New Protected Route

```javascript
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

// Route accessible only to authenticated users
router.get('/user-data', authMiddleware, (req, res) => {
  res.json({
    message: `Hello ${req.user.email}`,
    userId: req.user.id,
    role: req.user.role
  });
});

// Route accessible only to Managers
router.get('/manager-reports', authMiddleware, roleMiddleware('Manager'), (req, res) => {
  res.json({ reports: [...] });
});

// Route accessible to Manager or Admin only
router.delete('/user/:id', authMiddleware, roleMiddleware(['Manager', 'Admin']), (req, res) => {
  // Delete user logic
});

export default router;
```

### Checking User Role in Backend Handler

```javascript
router.post('/update-report', authMiddleware, (req, res) => {
  // Check role inside handler
  if (req.user.role === 'Admin' || req.user.role === 'Manager') {
    // Allow editing any report
  } else if (req.user.role === 'TeamMember') {
    // Only allow editing own report
    // Compare req.user.id with req.body.userId
  }
});
```

### Getting MongoDB User Data

```javascript
import User from '../models/User.js';

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
```

### Creating Admin User (Database Seed)

```javascript
import User from './models/User.js';
import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/weekly-report');

const admin = new User({
  username: 'admin',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'Admin'
});

admin.save().then(() => {
  console.log('Admin user created');
  process.exit(0);
});
```

## Frontend Code Snippets

### Using Auth Context in Components

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }

  return (
    <div>
      <h1>Welcome {user.username}</h1>
      
      {hasRole('Manager') && (
        <button>View Team Reports</button>
      )}

      {hasRole('Admin') && (
        <button>System Settings</button>
      )}

      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making API Calls (with automatic JWT)

```javascript
import API from '../api';
import { useAuth } from '../context/AuthContext';

function FetchData() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    // No need to manually add token - interceptor handles it
    API.get('/protected-endpoint')
      .then(response => setData(response.data))
      .catch(error => console.error(error));
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}
```

### Creating Protected Routes

```javascript
import ProtectedRoute from '../components/ProtectedRoute';
import AdminPanel from '../pages/AdminPanel';
import UserReports from '../pages/UserReports';

function AppRoutes() {
  return (
    <Routes>
      {/* Any authenticated user can access */}
      <Route 
        path="/reports" 
        element={<ProtectedRoute><UserReports /></ProtectedRoute>}
      />

      {/* Only Admin can access */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRoles="Admin">
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      {/* Manager or Admin can access */}
      <Route 
        path="/management" 
        element={
          <ProtectedRoute requiredRoles={['Manager', 'Admin']}>
            <ManagementPanel />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### Conditional Rendering Based on Role

```javascript
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, hasRole } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Show for all authenticated users */}
      <section>
        <h2>My Profile</h2>
        <p>Email: {user.email}</p>
      </section>

      {/* Show only for TeamMember */}
      {user.role === 'TeamMember' && (
        <section>
          <h2>Submit Weekly Report</h2>
          {/* Form here */}
        </section>
      )}

      {/* Show for Manager or Admin */}
      {hasRole(['Manager', 'Admin']) && (
        <section>
          <h2>Team Reports</h2>
          {/* Reports list */}
        </section>
      )}

      {/* Show only for Admin */}
      {hasRole('Admin') && (
        <section>
          <h2>System Administration</h2>
          {/* Admin controls */}
        </section>
      )}
    </div>
  );
}
```

### Manual API Call with Token (rarely needed)

```javascript
import axios from 'axios';

async function customAPICall() {
  const token = localStorage.getItem('token');

  try {
    const response = await axios.get(
      'http://localhost:5000/api/some-endpoint',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error('API Error:', error);
  }
}
```

### Accessing Current User

```javascript
// From localStorage
const user = JSON.parse(localStorage.getItem('user'));
console.log(user.username, user.email, user.role);

// From Auth Context
import { useAuth } from '../context/AuthContext';

function Component() {
  const { user } = useAuth();
  console.log(user);
}

// From API
import API from '../api';

API.get('/auth/me').then(response => {
  console.log(response.data.user);
});
```

### Form Submission with Error Handling

```javascript
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## Database

### MongoDB Collections

```javascript
// User collection structure
{
  _id: ObjectId,
  username: "john_doe",
  email: "john@example.com",
  password: "$2a$10$...",  // Hashed
  role: "TeamMember",      // or "Manager", "Admin"
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Querying Users

```bash
# Find user by email
db.users.findOne({ email: "john@example.com" })

# Find all managers
db.users.find({ role: "Manager" })

# Count users by role
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
])

# Update user role
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { role: "Manager" } }
)

# Delete user
db.users.deleteOne({ email: "john@example.com" })
```

## API Reference Quick Summary

### POST /api/auth/register
Request:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "TeamMember"
}
```

Response (201):
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123abc",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "TeamMember"
  }
}
```

### POST /api/auth/login
Request:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123abc",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "TeamMember"
  }
}
```

### GET /api/auth/me (Protected)
Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "user": {
    "id": "123abc",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "TeamMember"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Please provide all required fields"
}
```

### 401 Unauthorized
```json
{
  "message": "Token is not valid"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Required roles: Admin, but user has role: TeamMember"
}
```

### 409 Conflict
```json
{
  "message": "User already exists"
}
```

### 500 Server Error
```json
{
  "message": "Server error",
  "error": "Error details here"
}
```

## Useful Tools

### Postman (API Testing)
1. Download from https://www.postman.com/
2. Create new request
3. Set URL: http://localhost:5000/api/auth/login
4. Set method: POST
5. Add headers: Content-Type: application/json
6. Add body: {"email":"user@example.com","password":"pass123"}
7. Click Send

### MongoDB Compass (Database GUI)
1. Download from https://www.mongodb.com/products/compass
2. Connect to mongodb://localhost:27017
3. Browse collections visually
4. Add/edit/delete documents

### Chrome DevTools
1. F12 to open DevTools
2. Application tab → Cookies or Local Storage
3. Check stored token and user data
4. Network tab to see API requests
5. Console tab for errors

### curl Commands Cheat Sheet
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@ex.com","password":"pass123","role":"TeamMember"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@ex.com","password":"pass123"}'

# Protected route
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN_HERE"

# POST with data
curl -X POST http://localhost:5000/api/endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{"key":"value"}'
```

---

For more detailed information, see:
- [AUTHENTICATION.md](../AUTHENTICATION.md) - Full implementation guide
- [TESTING.md](../TESTING.md) - Test scenarios
- [AUTH_QUICK_START.md](../AUTH_QUICK_START.md) - Quick start guide
