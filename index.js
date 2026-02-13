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
      .setDescription("Generate keys (Admin)")
      .addStringOption(o =>
        o.setName("prefix").setDescription("Key Prefix").setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("amount").setDescription("1-50").setMinValue(1).setMaxValue(50).setRequired(true)
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
      ),

    new SlashCommandBuilder()
      .setName("checkall")
      .setDescription("Check all keys (Admin only)")

  ];

  await client.application.commands.set(cmds);
});

// ===== Interaction =====
client.on("interactionCreate", async (i) => {

  // ===== PANEL =====
  if (i.isChatInputCommand() && i.commandName === "panel") {

    if (i.user.id !== OWNER)
      return i.reply({ content: "❌ No permission / ไม่มีสิทธิ์ใช้งาน", ephemeral: true });

    const guideEmbed = new EmbedBuilder()
      .setColor("#9B59B6")
      .setTitle("🔐 Swift Hub | Get Key System")
      .setDescription(`
✨ **How to Get Your Key (English)** ✨

1️⃣ Click **Generate Token** 🎫  
2️⃣ Copy your token 📋  
3️⃣ Click **Redeem** and paste it ✅  
4️⃣ Receive your real key ⏳ (Auto delete in 10s)  
5️⃣ Use **Check Key** to see your key 🔍

━━━━━━━━━━━━━━━━━━

🇹🇭 **วิธีรับคีย์ (ภาษาไทย)** 🇹🇭

1️⃣ กด **Generate Token** 🎫  
2️⃣ กดคัดลอกโทเค็น 📋  
3️⃣ กด **Redeem** แล้ววางโทเค็น ✅  
4️⃣ รับคีย์จริง (หายอัตโนมัติ 10 วิ) ⏳  
5️⃣ กด **Check Key** เพื่อตรวจสอบ 🔍

━━━━━━━━━━━━━━━━━━

💖 Secure • Safe • Easy 💖
      `)
      .setFooter({ text: "Swift Hub • Secure Key System" });

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

  // ===== GENKEY =====
  if (i.isChatInputCommand() && i.commandName === "genkey") {

    if (i.user.id !== OWNER)
      return i.reply({ content: "❌ Admin only / เฉพาะแอดมิน", ephemeral: true });

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

      txt += `🔑 ${key} | ${d}h\n`;
    }

    i.reply({
      content: "```txt\n" + txt + "```",
      ephemeral: true
    });
  }

  // ===== CHECK ALL (ADMIN) =====
  if (i.isChatInputCommand() && i.commandName === "checkall") {

    if (i.user.id !== OWNER)
      return i.reply({ content: "❌ Admin only / เฉพาะแอดมิน", ephemeral: true });

    const keys = await Key.find();

    if (!keys.length)
      return i.reply({ content: "⚠️ No keys in system", ephemeral: true });

    let txt = "";

    keys.forEach(k => {
      txt += `${k.used ? "✅" : "❌"} ${k.key} | ${k.duration}h\n`;
    });

    i.reply({
      content: "```txt\n" + txt + "```",
      ephemeral: true
    });
  }

  // ===== BUTTONS =====
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
        content: `🎫 Your Token / โทเค็นของคุณ\n\n\`${t}\`\n\n📋 Tap to Copy`,
        ephemeral: true
      });
    }

    // Redeem
    if (i.customId === "redeem") {

      const modal = new ModalBuilder()
        .setCustomId("redeemModal")
        .setTitle("✅ Redeem Token");

      const input = new TextInputBuilder()
        .setCustomId("token")
        .setLabel("Paste Your Token / วางโทเค็นที่นี่")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );

      return i.showModal(modal);
    }

    // Check Key (USER)
    if (i.customId === "check") {

      const user = await User.findOne({ userId: i.user.id });

      if (!user)
        return i.reply({
          content: "❌ No Key Found\nไม่มีคีย์ในระบบ",
          ephemeral: true
        });

      if (Date.now() > user.expireAt)
        return i.reply({
          content: "⏰ Key Expired\nคีย์หมดอายุแล้ว",
          ephemeral: true
        });

      const embed = new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle("🔑 Your Active Key | คีย์ของคุณ")
        .addFields(
          {
            name: "📌 Key",
            value: `\`${user.key}\``
          },
          {
            name: "⏳ Expire",
            value: `${user.expireAt}`
          }
        )
        .setFooter({ text: "Tap key to copy 📋" });

      return i.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }

  // ===== MODAL =====
  if (i.type === InteractionType.ModalSubmit) {

    if (i.customId !== "redeemModal") return;

    const t = i.fields.getTextInputValue("token");

    const token = await Token.findOne({ token: t, used: false });

    if (!token)
      return i.reply({
        content: "❌ Invalid Token\nโทเค็นไม่ถูกต้อง",
        ephemeral: true
      });

    const key = await Key.findOne({ used: false });

    if (!key)
      return i.reply({
        content: "⚠️ No Key Stock\nคีย์หมดสต๊อก",
        ephemeral: true
      });

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
      content:
        `🎉 **Key Activated! | เปิดใช้งานสำเร็จ** 🎉\n\n` +
        `🔑 Key:\n\`${key.key}\`\n\n` +
        `⏳ Expire in: ${key.duration}h\n\n` +
        `📋 Tap to copy (10s auto delete)`,
      ephemeral: true
    });

    setTimeout(() => {
      msg.delete().catch(() => {});
    }, 10000);
  }

});

client.login(TOKEN);
