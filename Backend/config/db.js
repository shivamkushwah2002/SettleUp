import mongoose from "mongoose";

/**
 * Connect to MongoDB Atlas.
 * Reads MONGO_URL from .env file.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB Atlas connected");
  } catch (err) {
    console.log("MongoDB Error:", err.message);
  }
};

export default connectDB;
