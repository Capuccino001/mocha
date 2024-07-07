const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    alias: [""], 
    version: "1.3",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    shortDescription: "see the bot's prefix",
    longDescription: "See the bot's prefix in your chat box.",
    category: "members",
    guide: {
      en: "   {pn} reset: change prefix in your box chat to default"
    }
  },

  langs: {
    en: {
      reset: "Your prefix has been reset to default: %1",
      myPrefix: "✨| 𝙷𝚎𝚕𝚕𝚘 𝙵𝚛𝚒𝚎𝚗𝚍 |✨\n𝚃𝚑𝚒𝚜 𝚒𝚜 𝚖𝚢 𝙿𝚛𝚎𝚏𝚒𝚡 [ %1 ]\n\nHere's the commands that\nyou can use:\n\n━━ 📖 | 𝙴𝚍𝚞𝚌𝚊𝚝𝚒𝚘𝚗 ━━\n%1ai <𝑞𝑢𝑒𝑠𝑡𝑖𝑜𝑛>\n%1blackbox <𝑞𝑢𝑒𝑠𝑡𝑖𝑜𝑛>\n%1llama <𝑞𝑢𝑒𝑠𝑡𝑖𝑜𝑛>\n%1gemini <𝑞𝑢𝑒𝑠𝑡𝑖𝑜𝑛>\n\n━━ 🗣 | 𝙰𝚒 - 𝙲𝚑𝚊𝚝 ━━\n-knight <𝑐ℎ𝑎𝑡>\n-poet <𝑐ℎ𝑎𝑡>\n-tia <𝑐ℎ𝑎𝑡>\n\n━━ 🖼 | 𝙸𝚖𝚊𝚐𝚎 ━━\n%1animagine <𝑝𝑟𝑜𝑚𝑝𝑡>\n%1dalle <𝑝𝑟𝑜𝑚𝑝𝑡>\n%1gmage <𝑝𝑟𝑜𝑚𝑝𝑡>\n%1pinterest <𝑐𝑎𝑡> <-5>\n%1remini <𝑟𝑒𝑝𝑙𝑦 𝑡𝑜 𝑖𝑚𝑎𝑔𝑒>\n%1removebg <𝑟𝑒𝑝𝑙𝑦 𝑡𝑜 𝑖𝑚𝑎𝑔𝑒>\n\n━━ 📻 | 𝙼𝚞𝚜𝚒𝚌 ━━\n%1chords <𝑡𝑖𝑡𝑙𝑒 𝑏𝑦 𝑎𝑟𝑡𝑖𝑠𝑡>\n%1lyrics <𝑡𝑖𝑡𝑙𝑒 𝑏𝑦 𝑎𝑟𝑡𝑖𝑠𝑡>\n%1spotify <𝑡𝑖𝑡𝑙𝑒 𝑏𝑦 𝑎𝑟𝑡𝑖𝑠𝑡>\n\n𝚁𝚞𝚕𝚎𝚜 𝚝𝚘 𝚏𝚘𝚕𝚕𝚘𝚠 𝚍𝚞𝚛𝚒𝚗𝚐 𝚢𝚘𝚞𝚛 𝚜𝚝𝚊𝚢:\n▫No adult content (18+).\n▫No spamming (auto-kick).\n▫No changing the group\n(theme/emoji/name).\n\n Chat -𝚑𝚎𝚕𝚙 to see all commands."
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    // This is an empty onStart function
  },

  onChat: async function ({ event, message, getLang }) {
    if (event.body && (event.body.toLowerCase() === "prefix" || event.body.toLowerCase() === ""))
      return () => {
        return message.reply(getLang("myPrefix", global.GoatBot.config.prefix, utils.getPrefix(event.threadID)));
      };
  }
};