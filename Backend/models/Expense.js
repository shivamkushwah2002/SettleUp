import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    description: { type: String, required: true },
    amount: { type: Number, required: true },

    // main split data stored here
    splits: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        owes: Number,
      }
    ],

    splitType: { type: String, enum: ["equal", "exact", "between"], required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
