// pages/api/login.js
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { userName, password } = req.body;
  if (!userName || !password) return res.status(400).json({ message: "Username and password are required" });

  try {
    const db = await connectToDatabase();
    const user = await db.collection("users").findOne({ userName });
    if (!user) return res.status(401).json({ message: "Invalid username or password" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid username or password" });

const token = jwt.sign(
  {
    sub: user._id.toString(),
    userName: user.userName,
    email: user.userName, 
  },
  process.env.JWT_SECRET,
  { expiresIn: "2h" }
);
return res.status(200).json({ message: "Login successful", token });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
