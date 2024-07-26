const axios = require('axios');
const fs = require('fs');
const path = require('path');

const imageGenerationServices = [
    { url: 'https://markdevs-last-api.onrender.com/emi', param: 'prompt' },
    { url: 'https://emi-gen-j0rj.onrender.com/emi', param: 'prompt' },
    { url: 'https://samirxpikachuio.onrender.com/mageDef', param: 'prompt' } // New service added
];

module.exports = {
  config: {
    name: "animagine",
    aliases: [],
    author: "Vex_Kshitiz/coffee",
    version: "2.0",
    cooldowns: 20,
    role: 0,
    shortDescription: "Generate an image.",
    longDescription: "Generates an image based on a prompt.",
    category: "fun",
  },
  onStart: async function ({ message, args, api, event }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
    try {
      const prompt = args.join(" ");

      for (const service of imageGenerationServices) {
        const imageUrl = service.url;
        const queryParams = {
          [service.param]: prompt
        };

        // Adjust parameters for specific services if needed
        if (imageUrl === 'https://samirxpikachu.onrender.com/mageV2') {
          queryParams.aspect_ratio = "1:1";
          queryParams.style = Math.floor(Math.random() * 5) + 1;
          queryParams.presets = Math.floor(Math.random() * 5) + 1;
        }

        const response = await axios.get(imageUrl, {
          params: queryParams,
          responseType: "arraybuffer",
        });

        if (response.status !== 200) {
          throw new Error(`Failed to fetch image from ${imageUrl}. Status: ${response.status}`);
        }

        await sendImageResponse(message, response.data);
      }

    } catch (error) {
      console.error("Error:", error);
      await message.reply("❌ | Can't generate images from the provided APIs. Please try again later.");
    }
  }
};

async function sendImageResponse(message, imageData) {
  const cacheFolderPath = path.join(__dirname, "tmp");
  if (!fs.existsSync(cacheFolderPath)) {
    fs.mkdirSync(cacheFolderPath);
  }

  const imagePath = path.join(cacheFolderPath, `${Date.now()}_generated_image.png`);
  fs.writeFileSync(imagePath, Buffer.from(imageData, "binary"));

  const stream = fs.createReadStream(imagePath);
  await message.reply({
    body: "",
    attachment: stream,
  }, (err) => {
    if (err) {
      console.error("Error sending message:", err);
    } else {
      console.log("Image sent successfully");
      fs.unlinkSync(imagePath);
    }
  });
}