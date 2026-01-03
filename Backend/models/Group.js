// models/groupModel.js
import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const PairwiseSchema = new Schema({}, { strict: false, _id: false }); // flexible nested object

const GroupSchema = new Schema({
  // Basic Info
  groupName: { type: String, required: true },
  description: { type: String, default: "" },

  // Relations
  createdBy: { type: Types.ObjectId, ref: "User", required: true },
  members: [{ type: Types.ObjectId, ref: "User" }],

  // Debt Graph:
  // Pairwise stores the graph edge weights.
  // Keys: Debtor ID (string)
  // Values: Object { Creditor ID (string) : Amount (Number) }
  // Example: "UserA": { "UserB": 100 } means UserA owes UserB 100.
  pairwise: { type: Map, of: PairwiseSchema, default: {} },

  // Balances:
  // Derived from pairwise graph for quick lookup.
  // Positive = User is owed money.
  // Negative = User owes money.
  balances: { type: Map, of: Number, default: {} },

}, { timestamps: true });

export default model("Group", GroupSchema);
