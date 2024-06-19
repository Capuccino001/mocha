const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Define your list of bad words (if any)
const badWords = ["cleavage","cunt","sperm","cum","tounge","tit", "gay", "pussy", "dick","nude","sugar","fuck","hotdog","slut","🤭","🍼","shit","bitch","hentai","🥵","sugar","smut","naked","penis","🍑","👄","💋","bitch","hentai","sex","😋","boobs","🤤","undressed", "nude","😛","bra","dick","arse","asshole","ass","crack","fellatio","blow job","suck","hot","bikini","👙","💦","🍆","👌","🖕","😝","😜","🤪","🥴","🥺","cock","vagina","pedo","lips","69","yuck","gae","milf","prostitute","without clothe"];

module.exports = {
  config: {
    name: "prodia",
    aliases: [],
    version: "1.0",
    author: "vex_Kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "prodia",
    longDescription: "Generate images using Prodia",
    category: "utility",
    guide: {
      en: "{p} prodia [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const baseUrl = "https://prodia-kshitiz-rxop.onrender.com/gen";
      const apiKey = "79fa9d49-0f1e-4e21-a2c2-92891f2833f1";
      
      let prompt = args.join(" ").trim();

      if (!prompt) {
        return message.reply("Provide a prompt. Example: prodia cat");
      }

      // Function to check for bad words (if needed)
      function containsBadWords(text) {
        const lowerText = text.toLowerCase();
        return badWords.some(word => lowerText.includes(word));
      }

      // Check for bad words in the prompt (if needed)
      if (containsBadWords(prompt)) {
        return message.reply("❌ | Your prompt contains inappropriate language.");
      }

      // Generate a random model ID between 1 and 56
      const model_id = Math.floor(Math.random() * 56) + 1;

      const apiResponse = await axios.get(baseUrl, {
        params: {
          prompt: prompt,
          model: model_id,
          key: apiKey
        }
      });

      if (apiResponse.data.transformedImageUrl) {
        const imageUrl = apiResponse.data.transformedImageUrl;
        const imagePath = path.join(__dirname, "cache", `prodia.png`);
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
        const imageStream = imageResponse.data.pipe(fs.createWriteStream(imagePath));
        
        // Wait for image download to finish
        await new Promise((resolve, reject) => {
          imageStream.on("finish", resolve);
          imageStream.on("error", reject);
        });

        // Send the image as an attachment
        const stream = fs.createReadStream(imagePath);
        await message.reply({
          body: "",
          attachment: stream
        });

        // Delete the saved photo after sending
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Error deleting image:", err);
          }
        });
      } else {
        throw new Error("Image URL not found.");
      }
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred.");
    }
  }
};