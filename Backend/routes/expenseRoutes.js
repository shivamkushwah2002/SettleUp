import express from "express";
import { addExpense,getGroupExpenses } from "../controllers/expenseController.js";

const router = express.Router();

router.post("/:groupId/add", addExpense);
router.get("/:groupId", getGroupExpenses);

export default router;
