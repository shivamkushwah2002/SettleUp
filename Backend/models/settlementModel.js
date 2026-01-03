import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    payerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The person sending money
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The person receiving money
    amount: { type: Number, required: true },

    // Status Flow: 
    // pending (created) -> confirmed (receiver accepts) -> Balance Updated
    //                   -> rejected (receiver denies) -> No Change
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Settlement", settlementSchema);
