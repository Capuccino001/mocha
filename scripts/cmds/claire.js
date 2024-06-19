const axios = require('axios');
const PREFIXES = ["-claire"];
const API_ENDPOINT = 'https://liaspark.chatbotcommunity.ltd/ask/claire';

const askClaire = async (api, event, message) => {
    try {
        const { data } = await axios.get(`${API_ENDPOINT}?query=${encodeURIComponent(event.body.split(" ").slice(1).join(" "))}`);
        if (data?.message) {
            // Remove the specified part from the response
            let modifiedResponse = data.message.replace(/👑 𝗧𝗵𝗮𝗻𝗸 𝗟𝗶𝗮𝗻𝗲 𝗖𝗮𝗴𝗮𝗿𝗮:(.*?)(?=Total Requests)/gs, "");
            modifiedResponse = modifiedResponse.trim(); // Trim any leading or trailing whitespace
            const messageId = await api.sendMessage(`${modifiedResponse}\n━━━━━━━━━━━━━━━`, event.threadID);
            console.log('Sent answer as a reply to the user');
        } else {
            throw new Error('Invalid or missing response from API');
        }
    } catch (err) {
        console.error(`Failed to get an answer: ${err.stack || err.message}`);
        await api.sendMessage(`Failed to get an answer. Please try again. Details: ${err.message}\n━━━━━━━━━━━━━━━`, event.threadID);
    }
};

const startsWithPrefix = (text) => PREFIXES.some(prefix => text.toLowerCase().startsWith(`${prefix} `));

const config = {
    name: 'claire',
    version: '1',
    author: 'LiANE',
    credits: 'LiANE',
    role: 0,
    usePrefix: true,
    hasPermission: 2,
    category: 'Ai',
    commandCategory: 'Ai',
    description: 'ai',
    usages: '[prompt]',
    shortDescription: { en: 'an ai you can ask for everything' },
    longDescription: { en: 'ai with a twist' },
    guide: { en: '{pn}[prompt]' }
};

const onChat = async ({ api, event, message }) => {
    if (event.body.trim() === '-claire') {
        const response = `✨ 𝗖𝗹𝗮𝗶𝗿𝗲:\n━━━━━━━━━━━━━━━\nHello! How can I assist you today? If you have any questions or need help with something, feel free to ask.\n━━━━━━━━━━━━━━━`;
        await message.reply(response);
    } else if (startsWithPrefix(event.body)) {
        await message.reply(`🕰 | Fetching answers...`, async (err) => !err && await askClaire(api, event, message));
    }
};

module.exports = { config, onStart: async () => console.log('Bot started successfully!'), onChat, run: async () => await module.exports.onStart() };