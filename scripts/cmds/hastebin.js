const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { GoatWrapper } = require('fca-liane-utils');

module.exports = {
    config: {
        name: "hastebin",
        version: "1.0",
        author: "Cliff",
        countDown: 5,
        role: 2,
        shortDescription: "Send bot script",
        longDescription: "Send bot specified file",
        category: "owner",
        guide: "{pn} file name. Ex: .{pn} filename"
    },

    onStart: async function ({ message, args, api, event }) {
        const fileName = args[0];
        if (!fileName) {
            return api.sendMessage("Please provide a file name.", event.threadID, event.messageID);
        }

        const filePath = path.resolve(__dirname, `${fileName}.js`);
        if (!fs.existsSync(filePath)) {
            return api.sendMessage(`File not found: ${fileName}.js`, event.threadID, event.messageID);
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const response = await axios.get(`https://hastebinupload-ghost-2de6112e.vercel.app/hastebin?upload=${encodeURIComponent(fileContent)}`);
            const randomResponse = [ response.data.php, response.data.csharp, response.data.js, response.data.css, response.data.ts, response.data.kotlin ];
        const random = randomResponse[Math.floor(Math.random() * randomResponse.length)];
            const php = response.data.php;
            const csharp = response.data.csharp;
            const js = response.data.js;
            const css = response.data.css;
            const ts = response.data.ts;
            const uploadMessage = "𝗨𝗣𝗟𝗢𝗔𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬:";
            api.sendMessage(`${uploadMessage}\n\n${random}`, event.threadID, event.messageID);
        } catch (error) {
            console.error('Error:', error);
            api.sendMessage('An error occurred while processing your request.', event.threadID, event.messageID);
        }
    }
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });