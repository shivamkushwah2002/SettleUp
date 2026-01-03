import express from "express";
import {
  createSettlement,
  confirmSettlement,
  rejectSettlement,
  getPendingForUser
} from "../controllers/settlementController.js";

const router = express.Router();

// Settlement Routes
// Base Path: /api/settle

// POST /:settlementId/confirm - Confirm a settlement and update balances
router.post("/:settlementId/confirm", confirmSettlement);

// POST /:settlementId/reject - Reject a settlement request
router.post("/:settlementId/reject", rejectSettlement);

// GET /pending/:userId - Get pending requests for me (as receiver)
router.get("/pending/:userId", getPendingForUser);


// DYNAMIC LAST

// POST /:groupId/create - Create a new settlement request
router.post("/:groupId/create", createSettlement);


export default router;
