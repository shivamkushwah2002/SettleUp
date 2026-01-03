import User from "../models/User.js";
import bcrypt from "bcryptjs";

/**
 * Authenticate user and return user data.
 * Note: Should ideally return a JWT token for stateless auth (future improvement).
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email))
      return res.status(400).json({ msg: "Invalid email format" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Wrong password" });

    res.json({ msg: "Login successful", user });

  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};
