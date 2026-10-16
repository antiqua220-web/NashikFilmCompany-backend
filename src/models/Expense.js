import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    voucherNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Expense must be linked to a project'],
      index: true,
    },
    projectTitle: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Expense title or description is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Amount must be greater than or equal to 0'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['Camera', 'Lighting', 'Art', 'Sound', 'Talent', 'Logistics', 'Catering', 'Post', 'Grip', 'Wardrobe', 'Other'],
      default: 'Camera',
      index: true,
    },
    vendor: {
      type: String,
      default: 'General Vendor',
      trim: true,
    },
    paymentMode: {
      type: String,
      enum: ['Bank Transfer', 'UPI', 'Corporate Card', 'Petty Cash', 'Cheque'],
      default: 'Bank Transfer',
    },
    status: {
      type: String,
      enum: ['Approved', 'Paid', 'Under Review'],
      default: 'Paid',
      index: true,
    },
    invoiceRef: {
      type: String,
      default: '',
      trim: true,
    },
    receiptImage: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate unique voucher number (e.g. VCH-8012)
expenseSchema.pre('validate', async function (next) {
  if (!this.voucherNumber) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.voucherNumber = `VCH-${randomSuffix}`;
  }
  next();
});

export const Expense = mongoose.model('Expense', expenseSchema);
