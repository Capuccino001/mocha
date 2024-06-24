const axios = require("axios");

module.exports = {
  config: {
    name: "lyrics",
    version: "1.0",
    author: "rulex-al/loufi",
    countDown: 5,
    role: 0,
    category: "music"
  },

  onStart: async function ({ api, event, args }) {
    const songName = args.join(" ").trim();
    if (!songName) {
      api.sendMessage("Please provide a song name!", event.threadID, event.messageID);
      return;
    }

    const apiUrl = `https://lyrist.vercel.app/api/${encodeURIComponent(songName)}`;
    try {
      const response = await axios.get(apiUrl);
      const { lyrics, title, artist } = response.data;

      if (!lyrics) {
        api.sendMessage(`Sorry, lyrics for "${title}" by ${artist} not found!`, event.threadID, event.messageID);
      } else {
        const formattedLyrics = `🎧 | Title: ${title}\n🎤 | Artist: ${artist}\n\n${lyrics}`;
        api.sendMessage(formattedLyrics, event.threadID, event.messageID);
      }
    } catch (error) {
      console.error(`Error fetching lyrics for "${songName}":`, error);
      if (error.response) {
        if (error.response.status === 404) {
          api.sendMessage(`Sorry, lyrics for "${songName}" not found!`, event.threadID, event.messageID);
        } else {
          api.sendMessage(`Sorry, there was an error (${error.response.status}) getting the lyrics for "${songName}"!`, event.threadID, event.messageID);
        }
      } else {
        api.sendMessage(`Sorry, there was an error getting the lyrics for "${songName}"!`, event.threadID, event.messageID);
      }
    }
  },
};
