import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import settlementRoutes from "./routes/settlementRoutes.js";
import path from 'path';
import fs from 'fs';



// Load environment variables
dotenv.config();
// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));


// Routes
// API Routes Mounting
app.use("/api/auth", authRoutes); // Auth & User Profile
app.use("/api/groups", groupRoutes); // Group Management
app.use("/api/users", userRoutes); // User Search
app.use("/api/expenses", expenseRoutes); // Expense Management
app.use("/api/settle", settlementRoutes); // Settlement Logic

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
