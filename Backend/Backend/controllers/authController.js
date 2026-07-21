import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { trackBackendEvent } from "../utils/trackBackendEvent.js";

// Generate tokens
const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

// Signup
export const signup = async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ message: "Name must be between 2 and 100 characters" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must be between 8 and 128 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    await trackBackendEvent("USER_SIGNUP", {
      email: user.email,
      user_id: user._id
    }, req);

    
    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        customId: user.customId,
        createdAt: user.createdAt,
      },
    });

  } catch (err) {
    console.error("Signup Error:", err.message);

    
    await trackBackendEvent("SIGNUP_FAILED", {
      error: err.message
    }, req);

    return res.status(500).json({ message: "Unable to create account" });
  }
};


// Login
export const login = async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    
    await trackBackendEvent("USER_LOGIN", {
      email: user.email,
      user_id: user._id
    }, req);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.json({ access_token: accessToken, id: user.customId });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};

// Refresh Token (validate secret before verify)
export const refresh = (req, res) => {
  // Only read refresh token from the cookie (we set it in login)
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message:
        "No refresh token found in cookies. Ensure the client sends cookies (withCredentials: true) and that the cookie was set on login.",
    });
  }
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.warn("Refresh token verify error:", err.name, err.message);
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
    const accessToken = jwt.sign({ id: decoded.id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
    res.json({ access_token: accessToken });
  });
};

// Logout
export const logout = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.user_id || null;

    res.clearCookie("refreshToken");

    
    await trackBackendEvent("USER_LOGOUT", {
      user_id: userId,
      logout_reason: "manual_logout"
    }, req);

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Logout failed" });
  }
};
