const axios = require("axios");
const fs = require("fs");
const cookie = 'g.a000jAgkbuC3Z3pwjOu4YulB7kwqlmePsX2TCiqf68yHVd_PFrwT1JPNVjFsZInzfeSKnB99wwACgYKAVkSAQASFQHGX2Mi8IyCIo3a3I3NeBq9M5MxwhoVAUF8yKoNuSl2K2-sLRtC4vn2mpBr0076';

module.exports = {
  config: {
    name: "gemini",
    version: "1.0",
    author: "rehat--",
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

      let content = result.message;
      let imageUrls = result.imageUrls;

      let replyOptions = {
        body: formatMessage(content), // Apply header and footer to content
      };

      if (Array.isArray(imageUrls) && imageUrls.length > 0) {
        const imageStreams = [];

        if (!fs.existsSync(`${__dirname}/cache`)) {
          fs.mkdirSync(`${__dirname}/cache`);
        }

        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          const imagePath = `${__dirname}/cache/image` + (i + 1) + ".png";

          try {
            const imageResponse = await axios.get(imageUrl, {
              responseType: "arraybuffer",
            });
            fs.writeFileSync(imagePath, imageResponse.data);
            imageStreams.push(fs.createReadStream(imagePath));
          } catch (error) {
            console.error("Error occurred while downloading and saving the image:", error);
            message.reply(formatMessage('An error occurred.'));
          }
        }

        replyOptions.attachment = imageStreams;
      }

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
      message.reply(formatMessage('An error occurred.'));
      console.error(error.message);
    }
  },

  onReply: async function ({ message, event, Reply, args }) {
    const prompt = args.join(" ");
    let { author, commandName, messageID } = Reply;
    if (event.senderID !== author) return;

    try {
      const apiUrl = `https://rehatdesu.xyz/api/llm/gemini?query=${encodeURIComponent(prompt)}&uid=${author}&cookie=${cookie}`;
      const response = await axios.get(apiUrl);

      let content = response.data.message;
      let replyOptions = {
        body: formatMessage(content), // Apply header and footer to content
      };

      const imageUrls = response.data.imageUrls;
      if (Array.isArray(imageUrls) && imageUrls.length > 0) {
        const imageStreams = [];

        if (!fs.existsSync(`${__dirname}/cache`)) {
          fs.mkdirSync(`${__dirname}/cache`);
        }
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          const imagePath = `${__dirname}/cache/image` + (i + 1) + ".png";

          try {
            const imageResponse = await axios.get(imageUrl, {
              responseType: "arraybuffer",
            });
            fs.writeFileSync(imagePath, imageResponse.data);
            imageStreams.push(fs.createReadStream(imagePath));
          } catch (error) {
            console.error("Error occurred while downloading and saving the image:", error);
            message.reply(formatMessage('An error occurred.'));
          }
        }
        replyOptions.attachment = imageStreams;
      }
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
      console.error(error.message);
      message.reply(formatMessage("An error occurred."));
    }
  },
};

function formatMessage(content) {
  const header = "👩‍💻 | 𝙶𝚎𝚖𝚒𝚗𝚒 |\n━━━━━━━━━━━━━━━━\n";
  const footer = "\n━━━━━━━━━━━━━━━━";
  return header + content + footer;
}