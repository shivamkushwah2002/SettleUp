import User from "../models/User.js";

export const searchUsers = async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    }).select("_id name email");

    res.json({ success: true, data: users });
  } catch (err) {
    console.log("searchUsers error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
