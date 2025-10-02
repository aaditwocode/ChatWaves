import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protectroute(req, res, next) {
  try {
    const token = req.cookies.jwt;
    
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded) {
      return res.status(401).json({ message: "Not authorized, token not verified" });
    }

    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("Protect route error:", error);
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Not authorized, token expired" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
}