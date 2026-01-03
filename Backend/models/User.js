import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  password: { type: String, required: true }, // Hashed password

  contact: { type: String, required: true },   // Phone number (used for search/invites)

  profileImage: { type: String, default: "" }  // Optional image URL
},
  {
    timestamps: true // adds createdAt + updatedAt automatically
  });

export default mongoose.model("User", userSchema);
