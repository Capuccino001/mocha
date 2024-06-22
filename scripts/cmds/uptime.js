module.exports = {
  config: {
    name: "uptime",
    aliases: ["upt"],
    version: "1.0",
    author: "OtinXSandip",
    role: 0,
    category: "box chat"
  },
  onStart: async function ({ api, event, args, usersData, threadsData }) {
    try {
      const allUsers = await usersData.getAll();
      const allThreads = await threadsData.getAll();
      const uptime = process.uptime();

      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      const uptimeString = `${hours} Hrs ${minutes} mins ${seconds} secs...`;

      api.sendMessage(`(⁠ ⁠˘⁠ ⁠³⁠˘⁠)┌旦「 𝙾𝚗𝚕𝚒𝚗𝚎 」\n ${uptimeString}`, event.threadID);
    } catch (error) {
      console.error(error);
      api.sendMessage("An error occurred while retrieving data.", event.threadID);
    }
  }
};