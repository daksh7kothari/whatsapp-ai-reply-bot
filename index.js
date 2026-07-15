require("dotenv").config();
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const Anthropic = require("@anthropic-ai/sdk");
const Groq = require("groq-sdk");

const {
  AI_PROVIDER = "anthropic",
  ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL = "claude-sonnet-5",
  GROQ_API_KEY,
  GROQ_MODEL = "llama-3.3-70b-versatile",
  TARGET_CHAT_ID,
  REPLY_DELAY_SECONDS = "0",
  CHAT_HISTORY_MAX_CHARS = "20000",
} = process.env;

const provider = AI_PROVIDER.toLowerCase();
if (!["anthropic", "groq"].includes(provider)) {
  console.error(`Invalid AI_PROVIDER "${AI_PROVIDER}". Use "anthropic" or "groq".`);
  process.exit(1);
}
if (provider === "anthropic" && !ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY in .env");
  process.exit(1);
}
if (provider === "groq" && !GROQ_API_KEY) {
  console.error("Missing GROQ_API_KEY in .env");
  process.exit(1);
}
if (!TARGET_CHAT_ID) {
  console.error("Missing TARGET_CHAT_ID in .env. Run `npm run list-chats` to find it.");
  process.exit(1);
}

const instructionsPath = path.join(__dirname, "instructions.md");
function loadInstructions() {
  return fs.readFileSync(instructionsPath, "utf8");
}

// Loads any exported WhatsApp chats dropped in chat-history/ so the model
// knows past conversation context. Kept to the last CHAT_HISTORY_MAX_CHARS
// characters (most recent = bottom of a WhatsApp .txt export) to avoid
// blowing the model's context window / your token bill.
const chatHistoryDir = path.join(__dirname, "chat-history");
function loadChatHistoryContext() {
  if (!fs.existsSync(chatHistoryDir)) return "";

  const files = fs
    .readdirSync(chatHistoryDir)
    .filter((f) => f.toLowerCase().endsWith(".txt"));
  if (files.length === 0) return "";

  const combined = files
    .map((f) => fs.readFileSync(path.join(chatHistoryDir, f), "utf8"))
    .join("\n\n");

  const maxChars = Number(CHAT_HISTORY_MAX_CHARS) || 20000;
  const trimmed =
    combined.length > maxChars ? combined.slice(-maxChars) : combined;

  return `\n\nHere is past conversation history for context (may be truncated to the most recent part):\n\n${trimmed}`;
}

const anthropic = provider === "anthropic" ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;
const groq = provider === "groq" ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// Rolling conversation history for the single target chat (context for the model).
const MAX_HISTORY = 20;
let history = [];

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
  puppeteer: { headless: true, args: ["--no-sandbox"] },
});

client.on("qr", (qr) => {
  console.log("Scan this QR code with WhatsApp (Linked Devices):");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp AI reply bot is ready.");
  console.log(`Provider: ${provider} (${provider === "groq" ? GROQ_MODEL : ANTHROPIC_MODEL})`);
  console.log(`Auto-replying only in chat: ${TARGET_CHAT_ID}`);
});

client.on("auth_failure", (msg) => console.error("Auth failure:", msg));
client.on("disconnected", (reason) => console.log("Disconnected:", reason));

// whatsapp-web.js occasionally throws internal errors when WhatsApp Web
// changes its frontend. Log and keep running instead of crashing the bot.
process.on("unhandledRejection", (err) => {
  console.error("Ignored a background error, bot is still running:", err?.message || err);
});

client.on("message", async (message) => {
  try {
    if (message.from !== TARGET_CHAT_ID) return; // only the one selected chat
    if (message.fromMe) return; // don't react to your own messages
    if (message.isStatus || message.type !== "chat") return; // text only for MVP

    const userText = message.body?.trim();
    if (!userText) return;

    history.push({ role: "user", content: userText });
    history = history.slice(-MAX_HISTORY);

    const delaySec = Number(REPLY_DELAY_SECONDS) || 0;
    if (delaySec > 0) await new Promise((r) => setTimeout(r, delaySec * 1000));

    const reply = await getAiReply();
    if (!reply) return;

    history.push({ role: "assistant", content: reply });
    history = history.slice(-MAX_HISTORY);

    // Send directly by chat ID instead of message.getChat() — the latter
    // fetches a full chat model and crashes on some current WhatsApp Web builds.
    await client.sendMessage(TARGET_CHAT_ID, reply);
  } catch (err) {
    console.error("Error handling message:", err);
  }
});

async function getAiReply() {
  const system = loadInstructions() + loadChatHistoryContext();

  if (provider === "groq") {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 400,
      messages: [{ role: "system", content: system }, ...history],
    });
    return response.choices[0]?.message?.content?.trim();
  }

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 400,
    system,
    messages: history,
  });
  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text?.trim();
}

client.initialize();
