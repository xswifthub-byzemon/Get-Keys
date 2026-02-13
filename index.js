// Swift Hub Key Bot
// By Pai 💖 For Simon

require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
  InteractionType,
  EmbedBuilder
} = require("discord.js");

const mongoose = require("mongoose");
const crypto = require("crypto");

// ===== ENV =====
const TOKEN = process.env.BOT_TOKEN;
const MONGO = process.env.MONGO_URI;
const OWNER = process.env.OWNER_ID;

// ===== Client =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

// ===== MongoDB =====
mongoose.connect(MONGO).then(() => {
  console.log("MongoDB Connected");
});

// ===== Schemas =====
const User = mongoose.model("User", new mongoose.Schema({
  userId: String,
  key: String,
  expireAt: Date,
  hwid: String
}));

const Token = mongoose.model("Token", new mongoose.Schema({
  token: String,
  used: Boolean,
  userId: String
}));

const Key = mongoose.model("Key", new mongoose.Schema({
  key: String,
  duration: Number,
  used: Boolean
}));

// ===== Utils =====
function genToken(id) {
  return `${id}-Redeem-${crypto.randomBytes(3).toString("hex")}`;
}

function genKey(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function getDuration(type) {
  if (type === "6") return 6;
  if (type === "12") return 12;
  if (type === "24") return 24;

  const arr = [6, 12, 24];
  return arr[Math.floor(Math.random() * 3)];
}

// ===== Ready =====
client.once("ready", async () => {
  console.log("Bot Online");

  const cmds = [

    new SlashCommandBuilder()
      .setName("panel")
      .setDescription("Create key panel"),

    new SlashCommandBuilder()
      .setName("genkey")
      .setDescription("Generate keys")
      .addStringOption(o =>
        o.setName("prefix")
          .setDescription("Prefix")
          .setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("amount")
          .setDescription("1-50")
          .setMinValue(1)
          .setMaxValue(50)
          .setRequired(true)
      )
      .addStringOption(o =>
        o.setName("time")
          .setDescription("6/12/24/random")
          .setRequired(true)
          .addChoices(
            { name: "6h", value: "6" },
            { name: "12h", value: "12" },
            { name: "24h", value: "24" },
            { name: "Random", value: "r" }
          )
      )

  ];

  await client.application.commands.set(cmds);
});

// ===== Interaction =====
client.on("interactionCreate", async (i) => {

  // ===== Panel =====
  if (i.isChatInputCommand() && i.commandName === "panel") {

    if (i.user.id !== OWNER)
      return i.reply({ content: "No permission", ephemeral: true });

    // ===== Embed Guide =====
    const guideEmbed = new EmbedBuilder()
      .setColor("#8A2BE2")
      .setTitle("🔐 Swift Hub | Get Key Panel")
      .setDescription(`
✨ **How to Get Your Key (English Guide)** ✨

1️⃣ Click **Generate Token** to receive your personal token  
2️⃣ Copy the token (Tap to copy 📋)  
3️⃣ Click **Redeem** and paste your token  
4️⃣ Receive your real key (Auto delete in 10s ⏳)  
5️⃣ Use **Check Key** to see your active key

━━━━━━━━━━━━━━━━━━

🇹🇭 **วิธีรับคีย์ (ภาษาไทย)** 🇹🇭

1️⃣ กดปุ่ม **Generate Token** เพื่อรับโทเค็น  
2️⃣ กดคัดลอกโทเค็น 📋  
3️⃣ กดปุ่ม **Redeem** แล้ววางโทเค็น  
4️⃣ รับคีย์จริง (ข้อความหายอัตโนมัติใน 10 วิ ⏳)  
5️⃣ ใช้ปุ่ม **Check Key** เพื่อตรวจสอบคีย์ของคุณ

━━━━━━━━━━━━━━━━━━

💖 ขอให้สนุกกับการใช้งานนะคะ 💖
`)
      .setFooter({
        text: "Swift Hub • Secure Key System"
      });

    const row = new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId("token")
        .setLabel("🎫 Generate Token")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("redeem")
        .setLabel("✅ Redeem")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("check")
        .setLabel("🔍 Check Key")
        .setStyle(ButtonStyle.Secondary)
    );

    return i.reply({
      embeds: [guideEmbed],
      components: [row]
    });
  }

  // ===== GenKey =====
  if (i.isChatInputCommand() && i.commandName === "genkey") {

    if (i.user.id !== OWNER)
      return i.reply({ content: "No permission", ephemeral: true });

    const prefix = i.options.getString("prefix");
    const amount = i.options.getInteger("amount");
    const time = i.options.getString("time");

    let txt = "";

    for (let x = 0; x < amount; x++) {

      const d = getDuration(time);
      const key = genKey(prefix);

      await Key.create({
        key,
        duration: d,
        used: false
      });

      txt += `${key} | ${d}h\n`;
    }

    i.reply({
      content: "```\n" + txt + "```",
      ephemeral: true
    });
  }

  // ===== Buttons =====
  if (i.isButton()) {

    // Generate Token
    if (i.customId === "token") {

      const t = genToken(i.user.id);

      await Token.create({
        token: t,
        used: false,
        userId: i.user.id
      });

      return i.reply({
        content: `\`${t}\``,
        ephemeral: true
      });
    }

    // Redeem
    if (i.customId === "redeem") {

      const modal = new ModalBuilder()
        .setCustomId("redeemModal")
        .setTitle("Redeem Token");

      const input = new TextInputBuilder()
        .setCustomId("token")
        .setLabel("Enter Your Token")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );

      return i.showModal(modal);
    }

    // Check
    if (i.customId === "check") {

      const user = await User.findOne({ userId: i.user.id });

      if (!user)
        return i.reply({ content: "No key found ❌", ephemeral: true });

      if (Date.now() > user.expireAt)
        return i.reply({ content: "Key expired ⏰", ephemeral: true });

      return i.reply({
        content: `\`${user.key}\`\nExpire: ${user.expireAt}`,
        ephemeral: true
      });
    }
  }

  // ===== Modal =====
  if (i.type === InteractionType.ModalSubmit) {

    if (i.customId !== "redeemModal") return;

    const t = i.fields.getTextInputValue("token");

    const token = await Token.findOne({ token: t, used: false });

    if (!token)
      return i.reply({ content: "Invalid token ❌", ephemeral: true });

    const key = await Key.findOne({ used: false });

    if (!key)
      return i.reply({ content: "No key in stock ❗", ephemeral: true });

    token.used = true;
    await token.save();

    key.used = true;
    await key.save();

    const expire = new Date(Date.now() + key.duration * 3600000);

    await User.findOneAndUpdate(
      { userId: i.user.id },
      { key: key.key, expireAt: expire },
      { upsert: true }
    );

    const msg = await i.reply({
      content: `\`${key.key}\`\nExpire in ${key.duration}h ⏳`,
      ephemeral: true
    });

    setTimeout(() => {
      msg.delete().catch(() => {});
    }, 10000);
  }

});

client.login(TOKEN);
