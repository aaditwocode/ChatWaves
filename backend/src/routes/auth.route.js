import express from "express";
import { login, signup, logout,onboard } from "../controllers/auth.controller.js";
import { protectroute } from "../middleware/auth.middleware.js";  

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);

router.post("/onboard" , protectroute, onboard);

router.get("/me", protectroute, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

export default router;
