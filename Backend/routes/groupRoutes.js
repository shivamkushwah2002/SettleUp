import express from "express";
import {
    createGroup,
    getGroupDetails,
    getUserGroups,
    addMember,
    removeMember,
    updateGroup,
    getGroupBalances,
    joinGroupByCode
} from "../controllers/groupController.js";

const router = express.Router();

router.post("/create", createGroup);

router.post("/join-by-code", joinGroupByCode);

router.get("/user/:userId", getUserGroups);

router.get("/:groupId", getGroupDetails);

router.post("/:groupId/add-member", addMember);

router.delete("/:groupId/remove-member/:userId", removeMember);
router.put("/:groupId/edit", updateGroup);
router.get("/:groupId/balances", getGroupBalances);







export default router;
