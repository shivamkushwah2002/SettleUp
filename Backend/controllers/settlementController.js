// controllers/settlementController.js
import Settlement from "../models/settlementModel.js";
import Group from "../models/Group.js";
import { applySettlement } from "../utils/pairwiseHelper.js";

/**
 * Create a new settlement request.
 * Sets status to 'pending'. Balances are NOT updated yet.
 */
export const createSettlement = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { payerId, receiverId, amount } = req.body;

    if (!payerId || !receiverId || !amount)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const st = await Settlement.create({
      groupId,
      payerId,
      receiverId,
      amount,
      status: "pending"
    });

    return res.status(201).json({ success: true, data: st });
  } catch (err) {
    console.log("Settlement create error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Confirm a settlement.
 * Action:
 * 1. Updates status to 'confirmed'.
 * 2. Calls `applySettlement` to update the actual debt graph and balances.
 */
export const confirmSettlement = async (req, res) => {
  try {
    const { settlementId } = req.params;

    const st = await Settlement.findById(settlementId);
    if (!st) return res.status(404).json({ success: false, message: "Settlement not found" });

    st.status = "confirmed";
    await st.save();

    const g = await applySettlement(st.groupId, st.payerId, st.receiverId, st.amount);

    // Convert Map to plain object for JSON responses if necessary
    const balancesObj = g.balances instanceof Map ? Object.fromEntries(g.balances) : g.balances;

    return res.json({ success: true, message: "Confirmed", balances: balancesObj });
  } catch (err) {
    console.log("Confirm Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Reject a settlement request.
 * Action: Updates status to 'rejected'. No financial impact.
 */
export const rejectSettlement = async (req, res) => {
  try {
    const { settlementId } = req.params;

    const st = await Settlement.findById(settlementId);
    if (!st) return res.status(404).json({ success: false, message: "Not found" });

    st.status = "rejected";
    await st.save();

    return res.json({ success: true, message: "Rejected" });
  } catch (err) {
    console.log("Reject error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all pending settlement requests where the user is the receiver.
 * These appear in the dashboard for the user to Confirm/Reject.
 */
export const getPendingForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const pending = await Settlement.find({
      receiverId: userId,
      status: "pending",
    }).populate("payerId", "name email");

    return res.json({ success: true, data: pending });
  } catch (err) {
    console.log("Pending error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
