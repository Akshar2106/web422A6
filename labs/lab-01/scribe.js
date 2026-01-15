const path = require("path");
const util = require("util");
const { exec } = require("child_process");
const execAsync = util.promisify(exec);

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

// Identity Header
console.log("Git Scribe - Developed by Aksharkumar Patel - 1237902235");
console.log("--------------------------------------------------------------");

// API Key Validation
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.log("❌ Error: OPENROUTER_API_KEY not found");
  process.exit(1);
}

async function getStagedDiff() {
  try {
    const { stdout } = await execAsync("git diff --staged");
    const diff = stdout.trim();

    if (!diff) {
      console.log("❌ No staged changes found.");
      process.exit(1);
    }

    console.log(`✅ Diff found: ${diff.length} characters`);
    return diff;
  } catch (err) {
    console.log("❌ Not a git repository.");
    process.exit(1);
  }
}

(async function main() {
  await getStagedDiff();
})();
