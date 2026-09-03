import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Report from './models/Report.js';
import Category from './models/Category.js';

dotenv.config();

// Seed demo data for Sept 8 demo.
// Run: npm run seed
// Creates users (password = 123456 for all? No — see below),
// 3 categories, and 4 sample reports in different workflow states.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weekly-report';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected, clearing old demo data...');

  const emails = ['member@demo.com', 'manager@demo.com', 'admin@demo.com'];
  await User.deleteMany({ email: { $in: emails } });
  await Category.deleteMany({ name: { $in: ['Development', 'Design', 'Testing'] } });

  const member = await User.create({
    name: 'Demo Member',
    email: 'member@demo.com',
    password: await bcrypt.hash('member123', 10),
    role: 'member',
  });

  const manager = await User.create({
    name: 'Demo Manager',
    email: 'manager@demo.com',
    password: await bcrypt.hash('manager123', 10),
    role: 'manager',
  });

  const admin = await User.create({
    name: 'Demo Admin',
    email: 'admin@demo.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
  });

  const dev = await Category.create({ name: 'Development', description: 'Coding tasks' });
  await Category.create({ name: 'Design', description: 'UI/UX tasks' });
  await Category.create({ name: 'Testing', description: 'QA tasks' });

  await Report.deleteMany({ user: { $in: [member._id, manager._id] } });

  await Report.create([
    {
      // Approved report WITH a manager comment and one version in history
      user: member._id,
      category: dev._id,
      weekStart: '2026-08-24',
      done: 'Finished login page and API integration',
      plan: 'Build report form and filters',
      blockers: 'Waiting for API docs',
      hours: 32,
      status: 'approved',
      comments: [{ by: manager._id, text: 'Good work, approved.' }],
      versions: [
        {
          done: 'Started login page',
          plan: 'Finish login page',
          blockers: '',
          hours: 30,
        },
      ],
    },
    {
      // Waiting for manager review
      user: member._id,
      category: dev._id,
      weekStart: '2026-08-31',
      done: 'Built report CRUD and dashboard bars',
      plan: 'Testing and bug fixes',
      blockers: '',
      hours: 38,
      status: 'submitted',
    },
    {
      // Still a draft the member is writing
      user: member._id,
      weekStart: '2026-09-07',
      done: 'Started charts with Recharts',
      plan: 'Finish dashboard and category page',
      blockers: 'Chart colors look off',
      hours: 10,
      status: 'draft',
    },
    {
      user: manager._id,
      weekStart: '2026-08-31',
      done: 'Reviewed team reports, sprint planning',
      plan: 'Client demo preparation',
      blockers: 'None',
      hours: 25,
      status: 'submitted',
    },
  ]);

  console.log('Done! Login with:');
  console.log('  member@demo.com  / member123  (submits own reports)');
  console.log('  manager@demo.com / manager123 (reviews team, manages categories)');
  console.log('  admin@demo.com   / admin123   (everything + delete categories)');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
