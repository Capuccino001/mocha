const fs = require("fs");
const path = require("path");
const axios = require("axios");

// List of image generation services
const imageGenerationServices = [
    { url: 'https://markdevs-last-api.onrender.com/dalle', param: 'prompt' },
    { url: 'https://samirxpikachu.onrender.com/imagine', param: 'prompt' },
    { url: 'https://samirxpikachu.onrender.com/generate', param: 'prompt', modelParam: 'model' }
];

module.exports = {
  config: {
    name: "dalle",
    author: "coffee",
    version: "1.0",
    cooldowns: 10,
    role: 0,
    shortDescription: "Generate an image based on a prompt.",
    longDescription: "Generates an image based on a prompt using different services.",
    category: "fun",
  },
  onStart: async function ({ message, args, api, event }) {
    api.setMessageReaction("✍️", event.messageID, (err) => {}, true);
    try {
      const prompt = args.join(" ");

      for (const service of imageGenerationServices) {
        const imageUrl = service.url;
        const queryParams = {
          [service.param]: prompt
        };

        // Add model parameter if specified
        if (service.modelParam) {
          queryParams[service.modelParam] = Math.floor(Math.random() * 62) + 1;
        }

        const response = await axios.get(imageUrl, {
          params: queryParams,
          responseType: "arraybuffer",
        });

        await sendImageResponse(message, response.data);
      }

    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
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
      // Delete the image after it has been sent
      fs.unlinkSync(imagePath);
    }
  });
}