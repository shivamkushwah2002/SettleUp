import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  password: { type: String, required: true },

  contact: { type: String, required: true },   // phone number

  profileImage: { type: String, default: "" }  // optional image URL
},
{
  timestamps: true // adds createdAt + updatedAt automatically
});

export default mongoose.model("User", userSchema);
