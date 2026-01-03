import mongoose from "mongoose";
import Group from "../models/Group.js";
import Expense from "../models/Expense.js";

/**
 * Create a new group.
 * Initializes the group with the creator as the first member.
 */
export const createGroup = async (req, res) => {
  try {
    const { groupName, description = "", createdBy } = req.body;

    if (!groupName || !createdBy) {
      return res
        .status(400)
        .json({ success: false, message: "Group name & createdBy are required" });
    }

    const group = new Group({
      groupName,
      description,
      createdBy,
      members: [createdBy],
    });

    const saved = await group.save();

    return res.status(201).json({
      success: true,
      message: "Group created",
      data: saved,
    });
  } catch (err) {
    console.error("createGroup Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while creating group",
    });
  }
};


/**
 * Get details of a specific group.
 * Populates relationships for members and createdBy to show names/emails.
 */
export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid groupId",
      });
    }

    const group = await Group.findById(groupId)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: group,
    });
  } catch (err) {
    console.error("getGroupDetails Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching group details",
    });
  }
};

/**
 * Get all groups a user belongs to.
 * Used to populate the dashboard sidebar or main list.
 */
export const getUserGroups = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // Accept both string IDs and ObjectId values stored in DB.
    const cleanUserId = typeof userId === 'string' ? userId.trim() : userId;

    // Build candidate array to match either string or ObjectId types
    const candidateIds = [cleanUserId];
    if (mongoose.Types.ObjectId.isValid(cleanUserId)) {
      candidateIds.push(new mongoose.Types.ObjectId(cleanUserId));
    }

    const query = { members: { $in: candidateIds } };

    const groups = await Group.find(query)
      .populate("createdBy", "name email")
      .select("_id groupName description createdBy members createdAt updatedAt");


    if (!groups || groups.length === 0) {
      try {
        const sample = await Group.findOne().select('members').lean();
        ('Sample group members for debug:', sample?.members);
      } catch (dbgErr) {
        console.log('Error fetching sample group for debug:', dbgErr);
      }
    }
    return res.status(200).json({
      success: true,
      data: groups
    });

  } catch (err) {
    console.log("getUserGroups Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching user groups"
    });
  }
};

/**
 * Add a member to the group.
 * Permission: Only Group Admin (creator).
 * Checks if user is already a member before adding.
 */
export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;        // user to add
    const adminId = req.query.adminId;  // logged in user

    if (!adminId)
      return res.status(400).json({ success: false, message: "adminId required" });

    const group = await Group.findById(groupId);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });

    // check admin permission
    if (group.createdBy.toString() !== adminId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only admin can add members",
      });
    }

    if (group.members.includes(userId)) {
      return res.json({ success: true, message: "User already in group" });
    }

    group.members.push(userId);
    await group.save();

    res.json({ success: true, message: "Member added", data: group });
  } catch (err) {
    console.log("addMember error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Remove a member from the group.
 * Permission: Only Group Admin.
 * Admin cannot remove themselves (must delete group or transfer ownership - logic for transfer not implemented yet).
 */
export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params; // userId to remove
    const adminId = req.query.adminId;      // requester id

    if (!adminId)
      return res.status(400).json({ success: false, message: "adminId required" });

    const group = await Group.findById(groupId);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });

    // Only admin can remove
    if (group.createdBy.toString() !== adminId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only admin can remove members",
      });
    }

    // Admin cannot remove themselves
    if (group.createdBy.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot remove themselves",
      });
    }

    // Remove user
    group.members = group.members.filter(
      (m) => m.toString() !== userId.toString()
    );

    await group.save();

    res.json({ success: true, message: "Member removed", data: group });
  } catch (err) {
    console.log("removeMember error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update group details (Name, Description).
 * Permission: Only Group Admin.
 */
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;
    const adminId = req.query.adminId;

    if (!adminId)
      return res.status(400).json({ success: false, message: "adminId required" });

    const group = await Group.findById(groupId);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });

    // Only admin can edit
    if (group.createdBy.toString() !== adminId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only admin can edit group"
      });
    }

    if (name) group.groupName = name;
    if (description !== undefined) group.description = description;

    await group.save();

    res.json({ success: true, message: "Group updated", data: group });
  } catch (err) {
    console.log("updateGroup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/**
 * Get cached group balances.
 * This reads the pre-calculated balance map from the group document.
 * Crucial for fast loading of the dashboard without re-computing everything.
 */
export const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate("members", "name email _id");
    if (!group) {
      return res.json({ success: false, message: "Group not found" });
    }

    // Get balances from the Group's pairwise data
    const balances = group.balances || {};

    // Convert Map to object if needed
    const balancesObj = balances instanceof Map ? Object.fromEntries(balances) : balances;

    return res.json({
      success: true,
      data: balancesObj,
    });

  } catch (err) {
    console.log("Balance fetch error:", err);
    return res.json({ success: false, message: "Server error" });
  }
};

