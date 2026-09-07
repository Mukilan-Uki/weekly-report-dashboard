import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
<<<<<<< HEAD
import authRoutes from './routes/authRoutes.js';
=======

import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';
import categoryRoutes from './routes/categories.js';
import projectRoutes from './routes/projects.js';
>>>>>>> arena/01a06810-weekly-report-dashboard

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weekly-report';

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Backend running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

<<<<<<< HEAD
// Auth routes
app.use('/api/auth', authRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
=======
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/projects', projectRoutes);

// Connect to MongoDB, THEN start server.
// Works with local Mongo AND Atlas — just change MONGODB_URI in .env
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weekly-report';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    // Still start server so /health works and error is visible
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running WITHOUT database on port ${PORT}`);
    });
  });
>>>>>>> arena/01a06810-weekly-report-dashboard
