import express from "express";
import {
  createSettlement,
  confirmSettlement,
  rejectSettlement,
  getPendingForUser
} from "../controllers/settlementController.js";

const router = express.Router();

// FIXED PATHS FIRST
router.post("/:settlementId/confirm", confirmSettlement);
router.post("/:settlementId/reject", rejectSettlement);
router.get("/pending/:userId", getPendingForUser);

// DYNAMIC LAST
router.post("/:groupId/create", createSettlement);


export default router;
