import User from "../models/User.js";
import bcrypt from "bcryptjs";

/**
 * Register a new user.
 * Validations:
 * - Email format
 * - Password (complexity requirement)
 * - Confirm Password matching
 * - Contact number correctness
 * Encrypts password using bcrypt before saving.
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, contact, profileImage } = req.body;

    // REGEX
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const contactRegex = /^[6-9]\d{9}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
      ;

    // Validation
    if (!name.trim()) return res.status(400).json({ msg: "Name is required" });
    if (!emailRegex.test(email)) return res.status(400).json({ msg: "Invalid email format" });
    if (!passwordRegex.test(password))
      return res.status(400).json({ msg: "Password must include uppercase, lowercase, number (6+ chars)" });
    if (password !== confirmPassword) return res.status(400).json({ msg: "Passwords do not match" });
    if (!contactRegex.test(contact)) return res.status(400).json({ msg: "Invalid contact number" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      contact,
      profileImage: profileImage || ""
    });

    await newUser.save();
    res.json({ msg: "User registered successfully" });

  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};
