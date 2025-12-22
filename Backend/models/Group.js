// models/groupModel.js
import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const PairwiseSchema = new Schema({}, { strict: false, _id: false }); // flexible nested object

const GroupSchema = new Schema({
  groupName: { type: String, required: true },
  description: { type: String, default: "" },
  createdBy: { type: Types.ObjectId, ref: "User", required: true },
  members: [{ type: Types.ObjectId, ref: "User" }],
  // pairwise debts: object where keys are debtor userId strings, values are objects mapping creditorId->amount (number)
  pairwise: { type: Map, of: PairwiseSchema, default: {} },
  // optional cached sums for quick reads (derived from pairwise)
  balances: { type: Map, of: Number, default: {} },

}, { timestamps: true });

export default model("Group", GroupSchema);
