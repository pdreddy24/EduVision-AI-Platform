import jwt from "jsonwebtoken";

const ACCESS_TOKEN = process.env.ACCESS_TOKEN_SECRET;

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    const secret = ACCESS_TOKEN;

    jwt.verify(token, secret, (err, decoded) => {
      if (err) return res.status(401).json({ message: "Token invalid or expired" });
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
