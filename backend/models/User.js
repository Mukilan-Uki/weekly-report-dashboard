import mongoose from 'mongoose';

// User model — same idea as SplitNest: name, email, password, role.
// Role is either 'member' (default) or 'manager'.
// Manager can see everyone's reports, member sees only their own.
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
      enum: ['member', 'manager'],
      default: 'member',
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
