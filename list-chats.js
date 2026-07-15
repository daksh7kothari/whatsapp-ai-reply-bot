// Run once to find TARGET_CHAT_ID.
// Scan the QR code, then send any message in the chat you want to target
// (message yourself, or ask the other person to text you) — this prints its ID.
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
  puppeteer: { headless: true, args: ["--no-sandbox"] },
});

const seen = new Set();

client.on("qr", (qr) => {
  console.log("Scan this QR code with WhatsApp (Linked Devices):");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Connected!\n");
  console.log("Now send ANY message in the chat you want the bot to reply in:");
  console.log("  - message yourself (search 'Note to self' style, or your own number), or");
  console.log("  - ask the other person to text you\n");
  console.log("This window will print that chat's ID as soon as the message arrives.");
  console.log("Press Ctrl+C when you've got the ID you need.\n");
});

// message_create fires for both incoming AND outgoing messages, so messaging
// yourself works too.
client.on("message_create", async (message) => {
  try {
    const chat = await message.getChat();
    const id = chat.id._serialized;
    if (seen.has(id)) return;
    seen.add(id);
    console.log(`${chat.isGroup ? "[GROUP]" : "[DM]   "} ${id}  —  ${chat.name}`);
    console.log("Copy this ID into TARGET_CHAT_ID in your .env file.\n");
  } catch (err) {
    console.log("Couldn't read that chat's info (WhatsApp Web internals changed again — try a direct message instead of a group).");
  }
});

process.on("unhandledRejection", (err) => {
  console.log("Ignored a background error, still listening for messages:", err?.message || err);
});

client.initialize();
