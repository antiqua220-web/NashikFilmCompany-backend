import { Expense } from '../models/Expense.js';
import { Project } from '../models/Project.js';
import { Activity } from '../models/Activity.js';

// @desc    Get all expenses
// @route   GET /api/expenses
export const getExpenses = async (req, res) => {
  try {
    const { project, department, status, search } = req.query;
    const filter = {};

    if (project && project !== 'all' && project !== 'undefined') {
      filter.project = project;
    }
    if (department && department !== 'all' && department !== 'undefined') {
      filter.department = department;
    }
    if (status && status !== 'all' && status !== 'undefined') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { vendor: { $regex: q, $options: 'i' } },
        { voucherNumber: { $regex: q, $options: 'i' } },
        { invoiceRef: { $regex: q, $options: 'i' } },
      ];
    }

    const expenses = await Expense.find(filter)
      .populate('project', 'title code budget spent')
      .populate('createdBy', 'name email role')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch expenses',
    });
  }
};

// @desc    Get expense statistics & department breakdown
// @route   GET /api/expenses/stats
export const getExpenseStats = async (req, res) => {
  try {
    const { projectId } = req.query;
    const match = {};
    if (projectId && projectId !== 'all' && projectId !== 'undefined') {
      match.project = projectId;
    }

    const allExpenses = await Expense.find(match);

    const totalSpent = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const approvedTotal = allExpenses
      .filter((e) => e.status === 'Approved' || e.status === 'Paid')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const underReviewTotal = allExpenses
      .filter((e) => e.status === 'Under Review')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // Group by department
    const deptMap = {};
    allExpenses.forEach((e) => {
      const d = e.department || 'Other';
      if (!deptMap[d]) {
        deptMap[d] = { department: d, spent: 0, count: 0 };
      }
      deptMap[d].spent += e.amount || 0;
      deptMap[d].count += 1;
    });

    const departmentBreakdown = Object.values(deptMap).map((d) => ({
      ...d,
      percentage: totalSpent > 0 ? Math.round((d.spent / totalSpent) * 100) : 0,
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalSpent,
        approvedTotal,
        underReviewTotal,
        totalVouchers: allExpenses.length,
        departmentBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate expense stats',
    });
  }
};

// @desc    Create new expense voucher
// @route   POST /api/expenses
export const createExpense = async (req, res) => {
  try {
    let projectTitle = req.body.projectTitle;
    if (!projectTitle && req.body.project) {
      const proj = await Project.findById(req.body.project);
      if (proj) {
        projectTitle = proj.title;
        // Optionally update project spent field
        proj.spent = (proj.spent || 0) + (Number(req.body.amount) || 0);
        await proj.save();
      }
    }

    const expense = await Expense.create({
      ...req.body,
      projectTitle: projectTitle || 'Main Production',
      createdBy: req.user._id,
    });

    await Activity.create({
      user: req.user._id,
      project: expense.project,
      action: 'CREATED_EXPENSE_VOUCHER',
      title: `Logged expense voucher "${expense.title}" (₹${expense.amount})`,
      details: `Dept: ${expense.department} | Vendor: ${expense.vendor} | Status: ${expense.status}`,
    });

    res.status(201).json({
      success: true,
      expense,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create expense voucher',
    });
  }
};

// @desc    Update expense voucher
// @route   PUT /api/expenses/:id
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense voucher not found',
      });
    }

    res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update expense',
    });
  }
};

// @desc    Delete expense voucher
// @route   DELETE /api/expenses/:id
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense voucher not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense voucher deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete expense voucher',
    });
  }
};
