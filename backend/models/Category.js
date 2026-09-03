import mongoose from 'mongoose';

// Project / category model (e.g. Development, Design, Testing).
// Managers and admins manage these; members just pick one in the report form.
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);

export default Category;
