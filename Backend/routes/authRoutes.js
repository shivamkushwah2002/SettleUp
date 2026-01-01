import express from "express";
import { registerUser } from "../controllers/registerController.js";
import { loginUser } from "../controllers/loginController.js";
import User from "../models/User.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
router.get("/test-auth", (req, res) => {
  res.send("Auth routes are loaded");
});
router.post("/register", registerUser);
router.post("/login", loginUser);

// Multer setup for profile image uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadsDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// GET /api/auth/:id
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

// PUT /api/auth/:id - update profile (supports multipart/form-data with `profileImage`)
router.put('/:id', upload.single('profileImage'), async (req, res) => {
  try {
    const { name, contact } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (contact) updates.contact = contact;

    if (req.file) {
      // set profileImage to absolute accessible URL
      const host = req.get('host');
      const proto = req.protocol;
      updates.profileImage = `${proto}://${host}/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('Update profile error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/auth/:id - delete account
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // TODO: remove related data (groups, expenses) if needed

    await User.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
