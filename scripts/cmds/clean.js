const fs = require('fs').promises;
const path = require('path');

module.exports = {
  config: {
    name: "clean",
    aliases: ["c"], 
    author: "kshitiz",
    version: "2.0",
    cooldowns: 5,
    role: 2,
    shortDescription: {
      en: ""
    },
    longDescription: {
      en: "help to clean cache and tmp folder"
    },
    category: "owner",
    guide: {
      en: "{p}{n}"
    }
  },
  onStart: async function ({ api, event }) {
    const cacheFolderPath = path.join(__dirname, 'cache');
    const tmpFolderPath = path.join(__dirname, 'tmp');

    const cleanFolder = async (folderPath) => {
      try {
        const files = await fs.readdir(folderPath);
        if (files.length > 0) {
          await Promise.all(files.map(async (file) => {
            const filePath = path.join(folderPath, file);
            await fs.unlink(filePath);
            console.log(`File ${file} deleted successfully from ${folderPath}!`);
          }));
          console.log(`All files in the ${folderPath} folder deleted successfully!`);
        } else {
          console.log(`${folderPath} folder is empty.`);
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`${folderPath} folder not found.`);
        } else {
          console.error(`Error cleaning folder ${folderPath}:`, error);
        }
      }
    };

    api.sendMessage({ body: 'Cleaning cache and tmp folders...', attachment: null }, event.threadID, async () => {
      await cleanFolder(cacheFolderPath);
      await cleanFolder(tmpFolderPath);
      api.sendMessage({ body: 'Cache and tmp folders cleaned successfully!' }, event.threadID);
    });
  },
};