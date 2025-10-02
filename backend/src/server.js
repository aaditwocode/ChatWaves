import express from "express";
import dotenv from "dotenv";
import authroutes from "./routes/auth.route.js"; 
import useroutes from "./routes/user.route.js";
import { connectDB } from "./lib/db.js";
import cookieparser from "cookie-parser";



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieparser());
app.use("/api/auth", authroutes);
app.use("/api/users", useroutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
