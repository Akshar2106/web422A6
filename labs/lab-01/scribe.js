const path = require("path");
const util = require("util");
const { exec } = require("child_process");
const execAsync = util.promisify(exec);

const OpenAI = require("openai");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

// Identity Header (must be first output)
console.log("Git Scribe - Developed by Aksharkumar Patel - 137902235");
console.log("--------------------------------------------------------------");

// API Key Validation
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.log("❌ Error: OPENROUTER_API_KEY not found");
  process.exit(1);
}

async function getStagedDiffOrExit() {
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

function getPromptAndTemp(isCreative) {
  if (isCreative) {
    return {
      temperature: 1.2,
      systemPrompt:
        "You are a 17th Century Pirate. " +
        "Write ONE git commit message in pirate slang. " +
        "Output ONLY the commit message in plain text. " +
        "Keep it short. Still use 'type: description' format like 'feat: ...' or 'fix: ...'. " +
        "No markdown. No quotes. No explanations.",
    };
  }

  return {
    temperature: 0.1,
    systemPrompt:
      "You are an LLM inside a CLI tool that writes semantic git commit messages. " +
      "You will be given a git diff. Output ONLY ONE Conventional Commit message in plain text, " +
      "format: 'type: description' (e.g., 'feat: add logging' or 'fix(auth): resolve null pointer'). " +
      "No markdown. No quotes. No explanation. Keep it short.",
  };
}

function isRateLimitError(err) {
  return err?.status === 429 || String(err?.message || "").includes("429");
}

async function getCommitMessageFromLLM(diff, isCreative) {
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const { temperature, systemPrompt } = getPromptAndTemp(isCreative);

  // Try multiple models in order until one succeeds
  const modelsToTry = [
    "google/gemini-2.0-flash-exp:free",
    "openai/gpt-4.1-nano",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
  ];

  let lastErr = null;

  for (const model of modelsToTry) {
    try {
      const response = await client.chat.completions.create({
        model,
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: diff },
        ],
      });

      const msg = response.choices?.[0]?.message?.content?.trim();
      if (msg) return msg;

      return "chore: update code";
    } catch (err) {
      lastErr = err;

      // If rate limited, try next model
      if (isRateLimitError(err)) {
        console.log(`⚠️ Model rate-limited: ${model} (429). Trying next...`);
        continue;
      }

      // Other errors: stop and throw
      throw err;
    }
  }

  // If all models rate-limited:
  throw lastErr || new Error("All models failed.");
}

(async function main() {
  const isCreative = process.argv.includes("--creative");
  const diff = await getStagedDiffOrExit();

  try {
    const commitMsg = await getCommitMessageFromLLM(diff, isCreative);
    console.log("\n📝 Suggested Commit Message:");
    console.log(commitMsg);
  } catch (err) {
    if (isRateLimitError(err)) {
      console.log("❌ Rate limited (429) on all models. Try again later.");
      process.exit(1);
    }
    console.log("❌ LLM error:", err?.message || err);
    process.exit(1);
  }
})();
