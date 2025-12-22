// controllers/expenseController.js
import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import { splitExpense } from "../utils/splitLogic.js";
import { applyExpenseToPairwise } from "../utils/pairwiseHelper.js";

export const addExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { description, amount, paidBy, splitType, exactValues, selectedMembers } = req.body;

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
