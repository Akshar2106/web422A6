// lib/db.js
import mongoose from 'mongoose';

const connection = {};

export async function connectToDatabase() {
  if (connection.isConnected) return;

  const db = await mongoose.connect(process.env.MONGODB_CONN_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  connection.isConnected = db.connections[0].readyState;
}
