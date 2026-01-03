import express from "express";
import {
    createGroup,
    getGroupDetails,
    getUserGroups,
    addMember,
    removeMember,
    updateGroup,
    getGroupBalances
} from "../controllers/groupController.js";

const router = express.Router();

// Group Routes
// Base Path: /api/groups

// POST /create - Create a new group
router.post("/create", createGroup);

// GET /user/:userId - Get all groups for a user
router.get("/user/:userId", getUserGroups);

// GET /:groupId - Get specific group details
router.get("/:groupId", getGroupDetails);

// POST /:groupId/add-member - Add a user to a group (Admin only)
router.post("/:groupId/add-member", addMember);

// DELETE /:groupId/remove-member/:userId - Remove a user from a group (Admin only)
router.delete("/:groupId/remove-member/:userId", removeMember);

// PUT /:groupId/edit - Update group details (Admin only)
router.put("/:groupId/edit", updateGroup);

// GET /:groupId/balances - Get cached group balances
router.get("/:groupId/balances", getGroupBalances);







export default router;
