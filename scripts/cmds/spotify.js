const axios = require("axios");
const fs = require('fs-extra');
const { getStreamFromURL, shortenURL, randomString } = global.utils;

module.exports = {
  config: {
    name: "spotify",
    version: "1.0",
    author: "Vex_Kshitiz",
    countDown: 10,
    role: 0,
    shortDescription: "play song from spotify",
    longDescription: "play song from spotify",
    category: "music",
    guide: "{pn} sing songname"
  },

  onStart: async function ({ api, event, args, message }) {
    api.setMessageReaction("🕢", event.messageID, (err) => {}, true);
    try {
      let songTitle = '';

      const getSongTitleFromAttachment = async () => {
        const attachment = event.messageReply.attachments[0];
        if (attachment.type === "audio" || attachment.type === "video") {
          const shortenedURL = await shortenURL(attachment.url);
          const response = await axios.get(`https://audio-recom.onrender.com/kshitiz?url=${encodeURIComponent(shortenedURL)}`);
          return response.data.title;
        } else {
          throw new Error("Invalid attachment type.");
        }
      };

      if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        songTitle = await getSongTitleFromAttachment();
      } else if (args.length === 0) {
        throw new Error("Please provide a song name.");
      } else {
        songTitle = args.join(" ");
      }

      const response = await axios.get(`https://spotify-play-iota.vercel.app/spotify?query=${encodeURIComponent(songTitle)}`);
      const trackURLs = response.data.trackURLs;
      if (!trackURLs || trackURLs.length === 0) {
        throw new Error("No track found for the provided song name.");
      }

      const trackID = trackURLs[0];
      const downloadResponse = await axios.get(`https://sp-dl-bice.vercel.app/spotify?id=${encodeURIComponent(trackID)}`);
      const downloadLink = downloadResponse.data.download_link;

      const filePath = await downloadTrack(downloadLink);

      await message.reply({
        body: `🎧 Playing: ${songTitle}`,
        attachment: fs.createReadStream(filePath)
      });

      // Delete the downloaded file after sending
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
        else console.log("File deleted successfully.");
      });

      console.log("Audio sent successfully.");
    } catch (error) {
      console.error("Error occurred:", error);
      message.reply(`An error occurred: ${error.message}`);
    }
  }
};

async function downloadTrack(url) {
  const stream = await getStreamFromURL(url);
  const filePath = `${__dirname}/tmp/${randomString()}.mp3`;

  // Ensure the tmp directory exists
  await fs.ensureDir(`${__dirname}/tmp`);

  const writeStream = fs.createWriteStream(filePath);
  stream.pipe(writeStream);

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', reject);
  });
}