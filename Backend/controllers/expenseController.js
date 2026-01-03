// controllers/expenseController.js
import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import { splitExpense } from "../utils/splitLogic.js";
import { applyExpenseToPairwise, revertExpenseFromPairwise } from "../utils/pairwiseHelper.js";

/**
 * Delete an expense.
 * Process:
 * 1. Find the expense.
 * 2. REVERT the financial impact on group balances using `revertExpenseFromPairwise`.
 * 3. Delete the expense document.
 */
export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

    // Revert impact
    await revertExpenseFromPairwise(expense.groupId, expense.paidBy, expense.splits);

    // Delete
    await Expense.findByIdAndDelete(expenseId);

    res.json({ success: true, message: "Expense deleted" });
  } catch (err) {
    console.log("Delete error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update an existing expense.
 * Process:
 * 1. Find the existing expense.
 * 2. REVERT its current impact on balances.
 * 3. Calculate new splits based on the updated data.
 * 4. Update the expense document.
 * 5. APPLY the new impact to balances.
 */
export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    // same body as create
    const { description, amount, paidBy, splitType, exactValues, selectedMembers, category, date } = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

    const group = await Group.findById(expense.groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // 1. Revert old expense
    await revertExpenseFromPairwise(expense.groupId, expense.paidBy, expense.splits);

    // 2. Calculate new splits
    const members = group.members.map((m) => m.toString());
    let split;
    try {
      split = splitExpense({
        amount,
        members,
        paidBy,
        splitType,
        exactValues,
        selectedMembers
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // 3. Update expense doc
    expense.description = description;
    expense.amount = amount;
    expense.paidBy = paidBy;
    expense.splitType = splitType;
    expense.category = category;
    expense.date = date;
    expense.splits = split.splits;
    await expense.save();

    // 4. Apply new expense
    await applyExpenseToPairwise(expense.groupId, paidBy, split.splits);

    return res.json({ success: true, data: expense });

  } catch (err) {
    console.log("Update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Add a new expense to a group.
 * Process:
 * 1. Validate inputs.
 * 2. Calculate splits using `splitLogic`.
 * 3. Create Expense document.
 * 4. Update group debt graph using `applyExpenseToPairwise`.
 */
export const addExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { description, amount, paidBy, splitType, exactValues, selectedMembers, category, date } = req.body;

    if (!description || !amount || !paidBy || !splitType)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const members = group.members.map((m) => m.toString());

    let split;
    try {
      split = splitExpense({
        amount,
        members,
        paidBy,
        splitType,
        exactValues,
        selectedMembers
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const ex = await Expense.create({
      groupId,
      description,
      amount,
      paidBy,
      splitType,
      category: category || "Other",
      date: date || Date.now(),
      splits: split.splits
    });

    // Update pairwise debts
    await applyExpenseToPairwise(groupId, paidBy, split.splits);

    return res.json({ success: true, data: ex });
  } catch (err) {
    console.log("Expense Add Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    const ex = await Expense.find({ groupId }).populate("paidBy", "name email");

    return res.json({ success: true, data: ex });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Error fetching expenses" });
  }
};

// Get expenses analytics for a user across all their groups
export const getUserExpenseAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = "monthly" } = req.query; // "daily" or "monthly"

    // Get all groups where user is a member
    const groups = await Group.find({ members: userId });
    const groupIds = groups.map(g => g._id);

    // Get all expenses from user's groups
    const expenses = await Expense.find({ groupId: { $in: groupIds } })
      .populate("paidBy", "name email")
      .sort({ date: -1 });

    // Group by date (daily or monthly)
    const dateGrouped = {};
    expenses.forEach(exp => {
      const date = new Date(exp.date || exp.createdAt);
      let key;

      if (period === "daily") {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      }

      if (!dateGrouped[key]) {
        dateGrouped[key] = 0;
      }
      dateGrouped[key] += Number(exp.amount || 0);
    });

    // Convert to array format for charts
    const dateData = Object.entries(dateGrouped)
      .map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by category
    const categoryGrouped = {};
    expenses.forEach(exp => {
      const category = exp.category || "Other";
      if (!categoryGrouped[category]) {
        categoryGrouped[category] = 0;
      }
      categoryGrouped[category] += Number(exp.amount || 0);
    });

    // Convert to array format for charts
    const categoryData = Object.entries(categoryGrouped)
      .map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => b.amount - a.amount);

    return res.json({
      success: true,
      data: {
        dateData,
        categoryData,
        totalExpenses: expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0),
        totalCount: expenses.length
      }
    });
  } catch (err) {
    console.log("Analytics Error:", err);
    res.status(500).json({ success: false, message: "Error fetching analytics" });
  }
};
