const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

// Identity Header (must be first output)
console.log("Git Scribe - Developed by Aksharkumar Patel - 1237902235");
console.log("--------------------------------------------------------------");

// API Key Validation
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.log("❌ Error: OPENROUTER_API_KEY not found");
  process.exit(1);
}

console.log("✅ API Key found");
