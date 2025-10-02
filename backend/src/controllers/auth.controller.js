import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { createstreamUser } from "../lib/stream.js"; 

export async function signup(req, res) {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists try diff email" });
    }

    const idx = Math.floor(Math.random() * 100) + 1;
    const profilePic = `https://avatar.iran.liara.run/public/${idx}.png`;

    // Create new user
    const newUser = new User({
      fullName,
      email,
      password,
      profilePic,
    });

    await newUser.save();

    // Create Stream user
    await createstreamUser([{ 
      id: newUser._id.toString(),
      name: newUser.fullName,
      image: newUser.profilePic,
    }]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    // Set JWT token in HTTP-only cookie
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // prevent XSS attacks
      sameSite: "strict", // prevent CSRF attacks
      secure: process.env.NODE_ENV === "production" // HTTPS in production
    });

    // Return user data (excluding password)
    const userResponse = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      bio: newUser.bio,
      profilePic: newUser.profilePic,
      nativeLanguage: newUser.nativeLanguage,
      learningLanguage: newUser.learningLanguage,
      location: newUser.location,
      isOnboarded: newUser.isOnboarded,
    };

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userResponse
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set JWT token in HTTP-only cookie
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // prevent XSS attacks
      sameSite: "strict", // prevent CSRF attacks
      secure: process.env.NODE_ENV === "production" // HTTPS in production
    });

    // Return user data (excluding password)
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      bio: user.bio,
      profilePic: user.profilePic,
      nativeLanguage: user.nativeLanguage,
      learningLanguage: user.learningLanguage,
      location: user.location,
      isOnboarded: user.isOnboarded,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userResponse
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
}

export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ 
    success: true,
    message: "Logout successful" 
  });
}

export async function onboard(req, res) {
  try {
    const {fullName, bio, nativeLanguage, learningLanguage, location, profilePic } = req.body;
    
    // Since we're using protectroute middleware, req.user should be available
    const userId = req.user._id;

    // Validate required fields for onboarding
    if (!nativeLanguage || !learningLanguage) {
      return res.status(400).json({ 
        success: false,
        message: "Native language and learning language are required for onboarding" 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        fullName,
        bio, 
        nativeLanguage, 
        learningLanguage, 
        location, 
        profilePic, 
        isOnboarded: true 
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await createstreamUser([{ 
      id: updatedUser._id.toString(),
      name: updatedUser.fullName,
      image: updatedUser.profilePic,
    }]);

    res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Onboard error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
}