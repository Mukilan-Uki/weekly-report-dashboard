import mongoose from 'mongoose';

// User model.
// Roles: 'member' (= TeamMember), 'manager', 'admin'.
// - member: submits own reports
// - manager: reviews everyone's reports, manages categories
// - admin: everything manager can + delete categories + see user list
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['member', 'manager', 'admin'],
      default: 'member',
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
