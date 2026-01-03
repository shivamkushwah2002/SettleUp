import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Expense Details
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: "Other", enum: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Travel", "Health", "Education", "Other"] },
    date: { type: Date, default: Date.now },

    // Split Data:
    // This array stores the calculated owed amount for each member involved.
    // It is the source of truth for "who owes what" for a specific expense.
    splits: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        owed: Number,
      }
    ],

    splitType: { type: String, enum: ["equal", "exact", "between"], required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
