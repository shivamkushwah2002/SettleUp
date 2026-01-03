import express from "express";
import { addExpense, getGroupExpenses, getUserExpenseAnalytics, deleteExpense, updateExpense } from "../controllers/expenseController.js";

const router = express.Router();

// Expense Routes
// Base Path: /api/expenses

// POST /:groupId/add - Add a new expense
router.post("/:groupId/add", addExpense);

// GET /:groupId - Get all expenses for a group
router.get("/:groupId", getGroupExpenses);

// GET /analytics/:userId - Get expense analytics for a user
router.get("/analytics/:userId", getUserExpenseAnalytics);

// DELETE /:expenseId - Delete an expense (reverts impact first)
router.delete("/:expenseId", deleteExpense);

// PUT /:expenseId - Update an expense (reverts old impact, applies new)
router.put("/:expenseId", updateExpense);

export default router;
