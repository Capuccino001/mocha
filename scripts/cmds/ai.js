const axios = require('axios');

const services = [
    { url: 'http://markdevs-last-api.onrender.com/api/v2/gpt4', param: 'query' },
    { url: 'https://markdevs-last-api.onrender.com/api/v3/gpt4', param: 'ask' },
    { url: 'https://openaikey-x20f.onrender.com/api', param: 'prompt' },
    { url: 'http://jonellccprojectapis10.adaptable.app/api/chatgpt', param: 'input' },
    { url: 'https://openapi-idk8.onrender.com/bing-balanced', param: 'query' },
    { url: 'https://openapi-idk8.onrender.com/chatter', param: 'query' },
    { url: 'https://hiroshi-rest-api.replit.app/ai/turbo', param: 'ask' },
    { url: 'https://my-api-v1.onrender.com/api/v2/gpt4', param: 'query' }
];

const designatedHeader = "🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒";

const getAIResponse = async (question) => {
    for (const { url, param } of services) {
        try {
            const { data } = await axios.get(url, { params: { [param]: question }, timeout: 5000 });
            const response = data.gpt4 || data.reply || data.response || data.answer || data.message;
            if (response) return response;
        } catch (error) {
            console.error(`Error fetching from ${url}:`, error.message);
        }
    }
    throw new Error("No valid response from any AI service");
};

const handleRequest = async (api, event, input) => {
    try {
        if (!input) {
            api.sendMessage(`${designatedHeader}\n━━━━━━━━━━━━━━━━\nHello! How can I assist you today?\n━━━━━━━━━━━━━━━━`, event.threadID, event.messageID);
            return;
        }
        const response = await getAIResponse(input);
        api.sendMessage(`${designatedHeader}\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, event.messageID);
    } catch (error) {
        console.error("Error in handleRequest:", error.message);
        api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
};

const onStart = async ({ api, event, args }) => handleRequest(api, event, args.join(' ').trim());

const onChat = async ({ event, api }) => {
    const messageContent = event.body.trim().toLowerCase();
    const isReplyToBot = event.messageReply?.senderID === api.getCurrentUserID();
    const isDirectMessage = messageContent.startsWith("ai") && event.senderID !== api.getCurrentUserID();

    if (isDirectMessage || (isReplyToBot && event.messageReply.body.startsWith(designatedHeader))) {
        const input = isDirectMessage ? messageContent.replace(/^ai\s*/, "").trim() : messageContent;
        await handleRequest(api, event, input);
    }
};

module.exports = {
    config: {
        name: 'ai',
        author: 'coffee',
        role: 0,
        category: 'ai',
        shortDescription: 'AI to answer any question',
    },
    onStart,
    onChat
};