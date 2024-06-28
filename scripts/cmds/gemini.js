const axios = require("axios");
const fs = require("fs");

const cookie = 'g.a000jAgkbuC3Z3pwjOu4YulB7kwqlmePsX2TCiqf68yHVd_PFrwT1JPNVjFsZInzfeSKnB99wwACgYKAVkSAQASFQHGX2Mi8IyCIo3a3I3NeBq9M5MxwhoVAUF8yKoNuSl2K2-sLRtC4vn2mpBr0076';

const services = [
  { url: 'https://gemini-ai-pearl-two.vercel.app/kshitiz', params: (prompt, uid) => ({ prompt, uid, apikey: 'kshitiz' }) },
  { url: 'https://samirxpikachu.onrender.com/gemini', params: (prompt, uid) => ({ text: prompt, uid }) },
  { url: 'http://zcdsphapilist.replit.app/gemini', params: (prompt) => ({ prompt }) },
  { url: 'http://nash-rest-api.replit.app/gemini', params: (prompt) => ({ prompt }) }
];

module.exports = {
  config: {
    name: "gemini",
    version: "1.0",
    author: "rehat--/coffee",
    countDown: 5,
    role: 0,
    longDescription: { en: "Artificial Intelligence Google Gemini" },
    guide: { en: "{pn} <query>" },
    category: "ai",
  },
  clearHistory: function () {
    global.GoatBot.onReply.clear();
  },

  onStart: async function ({ message, event, args, commandName }) {
    const uid = event.senderID;
    const prompt = args.join(" ");

    if (!prompt) {
      message.reply("Please enter a query.");
      return;
    }

    if (prompt.toLowerCase() === "clear") {
      this.clearHistory();
      const clear = await axios.get(`https://rehatdesu.xyz/api/llm/gemini?query=clear&uid=${uid}&cookie=${cookie}`);
      message.reply(formatMessage(clear.data.message));
      return;
    }

    let apiUrl = `https://rehatdesu.xyz/api/llm/gemini?query=${encodeURIComponent(prompt)}&uid=${uid}&cookie=${cookie}`;

    if (event.type === "message_reply") {
      const imageUrl = event.messageReply.attachments[0]?.url;
      if (imageUrl) {
        apiUrl += `&attachment=${encodeURIComponent(imageUrl)}`;
      }
    }

    try {
      const response = await axios.get(apiUrl);
      const result = response.data;

      const replyOptions = await prepareReplyOptions(result.message, result.imageUrls);
      message.reply(replyOptions, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
          });
        }
      });
    } catch (error) {
      console.error("Primary API request failed:", error.message);
      await fallbackGeminiService(event, prompt, message, commandName);
    }
  },

  onReply: async function ({ message, event, Reply, args }) {
    const prompt = args.join(" ");
    const { author, commandName, messageID } = Reply;
    if (event.senderID !== author) return;

    try {
      const apiUrl = `https://rehatdesu.xyz/api/llm/gemini?query=${encodeURIComponent(prompt)}&uid=${author}&cookie=${cookie}`;
      const response = await axios.get(apiUrl);

      const replyOptions = await prepareReplyOptions(response.data.message, response.data.imageUrls);
      message.reply(replyOptions, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
          });
        }
      });
    } catch (error) {
      console.error("Primary API request failed:", error.message);
      await fallbackGeminiService(event, prompt, message, commandName);
    }
  },
};

async function fallbackGeminiService(event, prompt, message, commandName) {
  const senderID = event.senderID;
  for (const service of services) {
    try {
      const response = await axios.get(service.url, { params: service.params(prompt, senderID) });
      const answer = response.data.answer || response.data;
      message.reply(answer, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: senderID,
          });
        }
      });
      return;
    } catch (error) {
      console.warn(`API request to ${service.url} failed:`, error.message);
    }
  }

  message.reply("An error occurred while processing the request.");
}

async function prepareReplyOptions(content, imageUrls) {
  const replyOptions = { body: formatMessage(content) };

  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    const imageStreams = [];

    if (!fs.existsSync(`${__dirname}/tmp`)) {
      fs.mkdirSync(`${__dirname}/tmp`);
    }

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const imagePath = `${__dirname}/tmp/image` + (i + 1) + ".png";

      try {
        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imagePath, imageResponse.data);
        imageStreams.push(fs.createReadStream(imagePath));
      } catch (error) {
        console.error("Error occurred while downloading and saving the image:", error);
        throw new Error('Failed to download image');
      }
    }

    replyOptions.attachment = imageStreams;
  }

  return replyOptions;
}

function formatMessage(content) {
  const header = "👩‍💻 | 𝙶𝚘𝚘𝚐𝚕𝚎 𝙶𝚎𝚖𝚒𝚗𝚒 |\n━━━━━━━━━━━━━━━━\n";
  const footer = "\n━━━━━━━━━━━━━━━━";
  return header + content + footer;
}