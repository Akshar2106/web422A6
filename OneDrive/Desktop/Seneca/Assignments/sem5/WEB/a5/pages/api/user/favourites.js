import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Favourite from "@/lib/models/Favourite";

const isDev = process.env.NODE_ENV !== "production";

export default async function handler(req, res) {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log("[fav] connecting mongoose…");
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("[fav] mongoose connected");
    }

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      console.error("[fav] jwt verify error:", e.message);
      return res.status(401).json({ message: "Invalid token" });
    }

    const email = payload.email || payload.userName;
    if (!email) return res.status(400).json({ message: "Token missing email/username" });

    if (req.method === "GET") {
      console.log("[fav][GET] for", email);
      const items = await Favourite.find({ email });
      return res.status(200).json(items);
    }

    if (req.method === "POST") {
  console.log("[fav][POST] body:", req.body); 

  const { action, objectID, id } = req.body || {};
  const objId = String(objectID ?? id ?? "").trim();
  if (!objId) return res.status(400).json({ message: "objectID (id) is required" });

  if (action === "add") {
    const exists = await Favourite.findOne({ email, objectID: objId });
    if (!exists) await Favourite.create({ email, objectID: objId });
    const items = await Favourite.find({ email });
    return res.status(200).json(items);
  }

  if (action === "remove") {
    await Favourite.deleteOne({ email, objectID: objId });
    const items = await Favourite.find({ email });
    return res.status(200).json(items);
  }

  return res.status(400).json({ message: "Unknown action" });
}
    return res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    console.error("[fav] Internal error:", err);
    return res
      .status(500)
      .json({ message: isDev ? `Internal error: ${err.message}` : "Internal server error" });
  }
}
