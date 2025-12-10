import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { trackBackendEvent } from "../utils/trackBackendEvent.js";

const ACCESS_TOKEN = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;

// Generate tokens
const generateAccessToken = (user) => {
  if (!ACCESS_TOKEN) throw new Error("ACCESS_TOKEN_SECRET is not configured");
  return jwt.sign({ id: user._id }, ACCESS_TOKEN, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

const generateRefreshToken = (user) => {
  if (!REFRESH_TOKEN) throw new Error("REFRESH_TOKEN_SECRET is not configured");
  return jwt.sign({ id: user._id }, REFRESH_TOKEN, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

// Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.trim() === "") {
      return res.status(400).json({ message: "Name, email and password are required" });
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

    return res.status(500).json({ message: err.message });
  }
};


// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

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
    res.status(500).json({ message: err.message });
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
  if (!REFRESH_TOKEN) return res.status(500).json({ message: "REFRESH_TOKEN_SECRET not configured on server" });
  if (!ACCESS_TOKEN) return res.status(500).json({ message: "ACCESS_TOKEN_SECRET not configured on server" });

  jwt.verify(refreshToken, REFRESH_TOKEN, (err, decoded) => {
    if (err) {
      console.warn("Refresh token verify error:", err.name, err.message);
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
    const accessToken = jwt.sign({ id: decoded.id }, ACCESS_TOKEN, { expiresIn: ACCESS_TOKEN_EXPIRY });
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
