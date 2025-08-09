// lib/models/History.js
import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  query: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.History || mongoose.model("History", historySchema);
