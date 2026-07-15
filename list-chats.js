// Run once to find TARGET_CHAT_ID: scan QR, then prints all chats with their IDs.
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
  puppeteer: { headless: true, args: ["--no-sandbox"] },
});

client.on("qr", (qr) => {
  console.log("Scan this QR code with WhatsApp (Linked Devices):");
  qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
  console.log("Connected. Fetching chats...\n");
  const chats = await client.getChats();
  for (const chat of chats) {
    console.log(`${chat.isGroup ? "[GROUP]" : "[DM]   "} ${chat.id._serialized}  —  ${chat.name}`);
  }
  console.log("\nCopy the id (e.g. 911234567890@c.us) into TARGET_CHAT_ID in your .env file.");
  process.exit(0);
});

client.initialize();
