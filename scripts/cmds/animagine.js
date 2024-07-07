const fs = require("fs");
const path = require("path");
const axios = require("axios");

// List of image generation services
const imageGenerationServices = [
    { url: 'https://markdevs-last-api.onrender.com/emi', param: 'prompt' },
    { url: 'https://emi-gen-j0rj.onrender.com/emi', param: 'prompt' },
    { url: 'https://samirxpikachu.onrender.com/animagine', param: 'prompt' }
];

module.exports = {
  config: {
    name: "animagine",
    aliases: [],
    author: "coffee",
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

        // Determine if the service has additional parameters (resolution, model, quality tag)
        if (imageUrl === 'https://samirxpikachu.onrender.com/animagine') {
          // Add resolution parameter
          queryParams.resolution = "1:1"; // Default resolution, can be adjusted based on API's default behavior

          // Add model parameter
          queryParams.model = ""; // Empty model parameter, letting the service choose

          // Add quality tag parameter
          queryParams.qualitytag = "4"; // Default quality tag, can be adjusted based on API's default behavior
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