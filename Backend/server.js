import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import settlementRoutes from "./routes/settlementRoutes.js";



// Load environment variables
dotenv.config();
// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());


// Routes
app.use("/api/auth", authRoutes);

// Group routes
app.use("/api/groups", groupRoutes);

app.use("/api/users", userRoutes);

app.use("/api/expenses", expenseRoutes);


app.use("/api/settle", settlementRoutes);

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
