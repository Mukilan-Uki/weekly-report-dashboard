import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Report from './models/Report.js';

dotenv.config();

// Seed demo data for Sept 8 demo.
// Run: npm run seed
// Creates:
//   manager@demo.com / manager123 (role: manager)
//   member@demo.com  / member123  (role: member)
//   + 3 sample reports
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weekly-report';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected, clearing old demo data...');

  await User.deleteMany({ email: { $in: ['manager@demo.com', 'member@demo.com'] } });

  const managerPass = await bcrypt.hash('manager123', 10);
  const memberPass = await bcrypt.hash('member123', 10);

  const manager = await User.create({
    name: 'Demo Manager',
    email: 'manager@demo.com',
    password: managerPass,
    role: 'manager',
  });

  const member = await User.create({
    name: 'Demo Member',
    email: 'member@demo.com',
    password: memberPass,
    role: 'member',
  });

  await Report.deleteMany({ user: { $in: [manager._id, member._id] } });

  await Report.create([
    {
      user: member._id,
      weekStart: '2026-08-24',
      done: 'Finished login page and API integration',
      plan: 'Build report form and filters',
      blockers: 'Waiting for API docs',
      hours: 32,
    },
    {
      user: member._id,
      weekStart: '2026-08-31',
      done: 'Built report CRUD and dashboard bars',
      plan: 'Testing and bug fixes',
      blockers: '',
      hours: 38,
    },
    {
      user: manager._id,
      weekStart: '2026-08-31',
      done: 'Reviewed team reports, sprint planning',
      plan: 'Client demo preparation',
      blockers: 'None',
      hours: 25,
    },
  ]);

  console.log('Done! Login with:');
  console.log('  manager@demo.com / manager123  (sees whole team)');
  console.log('  member@demo.com / member123   (sees own only)');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
