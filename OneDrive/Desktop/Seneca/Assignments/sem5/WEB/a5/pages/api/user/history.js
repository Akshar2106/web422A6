import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import History from "@/lib/models/History";

export default async function handler(req, res) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    const email = payload.email || payload.userName;
    if (!email) return res.status(400).json({ message: "Token missing email/username" });

    if (req.method === "GET") {
      const items = await History.find({ email }).sort({ createdAt: -1 }).lean();
      return res.status(200).json(items);
    }

    if (req.method === "POST") {
      const { query, action, id } = req.body || {};

      if (action === "clear") {
        await History.deleteMany({ email });
        return res.status(200).json([]);
      }

      if (action === "remove") {
        if (!id) return res.status(400).json({ message: "id is required" });
        await History.deleteOne({ _id: id, email });
        const items = await History.find({ email }).sort({ createdAt: -1 }).lean();
        return res.status(200).json(items);
      }

      if (!query) return res.status(400).json({ message: "query is required" });
      await History.create({ email, query, createdAt: new Date() });
      const items = await History.find({ email }).sort({ createdAt: -1 }).lean();
      return res.status(200).json(items);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    console.error("[history] Internal error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
