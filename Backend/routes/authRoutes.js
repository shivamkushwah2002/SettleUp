import express from "express";
import { registerUser } from "../controllers/registerController.js";
import { loginUser } from "../controllers/loginController.js";
import User from "../models/User.js";


const router = express.Router();
router.get("/test-auth", (req, res) => {
  res.send("Auth routes are loaded");
});
router.post("/register", registerUser);
router.post("/login", loginUser);
// GET /api/user/:id
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});


// console.log("REGISTER CONTROLLER:", registerUser);
// console.log("LOGIN CONTROLLER:", loginUser);

// const router = express.Router();
// router.get("/debug", (req, res) => res.send("Debug Route Working"));
// router.post("/register", registerUser);
// router.post("/login", loginUser);

export default router;
