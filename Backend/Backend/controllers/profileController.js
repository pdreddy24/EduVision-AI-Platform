import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Get user details
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // include customId
    res.json({ name: user.name, email: user.email, createdAt: user.createdAt, customId: user.customId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// changePassword handler
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { current_password, new_password } = req.body || {};

    if (!current_password || !new_password) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    if (typeof new_password !== "string" || new_password.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(new_password, salt);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// changeName handler
export const changeName = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    let { name } = req.body || {};
    if (typeof name !== "string") name = String(name || "");
    name = name.trim();

    if (!name) return res.status(400).json({ message: "Name is required" });
    if (name.length < 2 || name.length > 100) return res.status(400).json({ message: "Name must be between 2 and 100 characters" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name;
    await user.save();

    res.json({ message: "Name updated successfully", name: user.name, customId: user.customId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};