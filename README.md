# WhatsApp AI Reply Bot 🤖

This bot **automatically replies to WhatsApp messages for you** — in ONE chat you choose — using AI (Claude or Groq). You give it instructions (like "reply casually, keep it short"), and it texts back like you would.

No coding knowledge needed to run it. Just follow the steps below.

---

## ⚠️ Before you start

- This uses your **real personal WhatsApp account** (linked like WhatsApp Web). It is **not** the official WhatsApp Business API — it's an unofficial tool. Don't spam people with it or WhatsApp may temporarily restrict your number. Use it on one chat, for personal use, like this MVP is meant for.
- You need an API key from **either** [Anthropic (Claude)](https://console.anthropic.com/settings/keys) **or** [Groq](https://console.groq.com/keys). Groq is free to start.
- You need [Node.js](https://nodejs.org) installed (version 18 or newer). If you don't have it, download it from that link and install it like any other app.

---

## 🚀 Setup (step by step)

### 1. Download this project

Click the green **Code** button on this GitHub page → **Download ZIP** → unzip it somewhere on your computer.

(Or if you know git: `git clone <this-repo-url>`)

### 2. Open a terminal in the project folder

- **Windows**: open the unzipped folder, right-click inside it → "Open in Terminal"
- **Mac**: open Terminal app, type `cd ` (with a space), drag the folder into the terminal window, press Enter

### 3. Install the bot's dependencies

Type this and press Enter:

```
npm install
```

This downloads everything the bot needs. Takes a few minutes, that's normal.

### 4. Create your settings file

Copy the example settings file to a real one:

```
cp .env.example .env
```

(Windows without `cp`? Just duplicate `.env.example` in the file explorer and rename the copy to `.env`)

### 5. Add your AI key

Open the new `.env` file in any text editor (Notepad, TextEdit, VS Code — anything). You'll see:

```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxx
GROQ_API_KEY=gsk_xxxx
```

- If using **Claude**: leave `AI_PROVIDER=anthropic`, paste your key after `ANTHROPIC_API_KEY=`
- If using **Groq** (free): change it to `AI_PROVIDER=groq`, paste your key after `GROQ_API_KEY=`

Save the file.

### 6. Find the chat you want the bot to reply in

Run:

```
npm run list-chats
```

A QR code will appear in your terminal. On your phone:
**WhatsApp → Settings → Linked Devices → Link a Device** → scan the QR code.

Once connected, it'll tell you to **send any message in the chat you want to target** — message yourself, or ask the other person to text you. As soon as that message arrives, it prints the chat's ID, like:

```
[DM]    911234567890@c.us  —  Mom
```

Copy that ID (e.g. `911234567890@c.us`). Then press `Ctrl+C` to stop this script.

### 7. Set your target chat

Open `.env` again, find this line:

```
TARGET_CHAT_ID=
```

Paste the ID after the `=`, like:

```
TARGET_CHAT_ID=911234567890@c.us
```

Save the file.

### 8. Write your instructions

Open `instructions.md` in a text editor. This is where you tell the bot **how to talk as you** — tone, what to say, what not to say, facts about yourself, etc. It's already got a starter template — edit it however you like. Plain English, no code.

### 8b. (Optional) Give it your past chat history for context

Want the bot to know how you and this person have talked before, so replies sound more like an actual continuation instead of a stranger? Export the chat and drop it in:

```
chat-history/
```

How to export from WhatsApp:
1. Open the chat on your phone → tap the three dots (⋮) → **More** → **Export chat**
2. Choose **Without Media** (keeps it small, text only)
3. Send/save the resulting `.txt` file to your computer
4. Move it into the `chat-history/` folder in this project

The bot automatically reads every `.txt` file in that folder and feeds it to the AI as background context. No restart needed if you swap the file before starting the bot.

⚠️ This folder is already excluded from git (`.gitignore`) so your private conversations never get uploaded to GitHub — keep it that way, don't force-add files in there.

### 9. Start the bot

```
npm start
```

Scan the QR code once more if asked. Once you see:

```
WhatsApp AI reply bot is ready.
Auto-replying only in chat: 911234567890@c.us
```

...it's live! Any message sent to you in that chat will get an AI reply automatically, based on your instructions.

To stop it, go to the terminal and press `Ctrl + C`.

---

## 🛠️ Common questions

**Can it reply in multiple chats?**
Not in this version — on purpose, so you can test it safely on one chat first. `TARGET_CHAT_ID` only accepts one chat.

**Can I change how the bot talks later?**
Yes — just edit `instructions.md` anytime and restart the bot (`Ctrl+C` then `npm start` again).

**Does it read my old messages?**
Not automatically — it only reacts to new messages that arrive after it's running. If you want it to know your chat history, export it and drop it in `chat-history/` (see step 8b).

**Is my WhatsApp data sent anywhere?**
Only the message text from your chosen chat (plus anything you put in `chat-history/`) is sent to the AI provider (Anthropic or Groq) you picked, to generate a reply. Nothing else leaves your computer.

**"QR code expired" or bot won't connect?**
Close the terminal, delete the `.wwebjs_auth` folder in the project, and run `npm start` again to re-scan.

**Getting a crash with `t: t` or `r: r` in the error?**
This is a known bug in the underlying library ([whatsapp-web.js issue #5733](https://github.com/pedroslopez/whatsapp-web.js/issues/5733)) — happens when WhatsApp updates their website faster than the library can keep up, mostly on group chats. Fix: target a **direct message (DM)** chat instead of a group, and run `npm install whatsapp-web.js@latest` to get the newest patch.

---

## 📁 What's in this project

| File | What it does |
|---|---|
| `index.js` | The bot itself — connects to WhatsApp, listens for messages, gets AI replies, sends them |
| `list-chats.js` | Helper script to find your chat's ID |
| `instructions.md` | Your instructions for how the bot should reply — edit this freely |
| `chat-history/` | Drop exported WhatsApp `.txt` chats here for the bot to use as context (gitignored) |
| `.env` | Your private settings (API keys, target chat) — **never share this file or commit it to git** |

---

## 📜 License

Free to use and modify for personal projects.
