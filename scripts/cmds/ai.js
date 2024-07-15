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
        const response = await fetchFromAI(url, { [param]: question });
        if (response) {
            return response;
        }
    }
    throw new Error("No valid response from any AI service");
};

const fetchFromAI = async (url, params) => {
    try {
        const { data } = await axios.get(url, {
            params,
            timeout: 5000  // Timeout set to 5 seconds
        });
        return data.gpt4 || data.reply || data.response || data.answer || data.message;
    } catch (error) {
        console.error(`Network Error fetching from ${url}:`, error.message);
        return null;
    }
};

const handleCommand = async (api, event, args) => {
    try {
        const question = args.join(" ").trim();
        if (!question) {
            api.sendMessage(`${designatedHeader}\n━━━━━━━━━━━━━━━━\nHello! How can I assist you today?\n━━━━━━━━━━━━━━━━`, event.threadID, event.messageID);
            return;
        }

        const response = await getAIResponse(question);
        api.sendMessage(`${designatedHeader}\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, event.messageID);
    } catch (error) {
        console.error("Error in handleCommand:", error.message);
        api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
};

const onStart = async ({ api, event, args }) => {
    try {
        const input = args.join(' ').trim();
        if (!input) {
            api.sendMessage(`${designatedHeader}\n━━━━━━━━━━━━━━━━\nHello! How can I assist you today?\n━━━━━━━━━━━━━━━━`, event.threadID, event.messageID);
            return;
        }

        const response = await getAIResponse(input);
        api.sendMessage(`${designatedHeader}\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, event.messageID);
    } catch (error) {
        console.error("Error in onStart:", error.message);
        api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
};

const onChat = async ({ event, api }) => {
    const messageContent = event.body.trim().toLowerCase();
    const isReplyToBot = event.messageReply && event.messageReply.senderID === api.getCurrentUserID();
    const isDirectMessage = messageContent.startsWith("ai") && event.senderID !== api.getCurrentUserID();

    if (isDirectMessage || (isReplyToBot && event.messageReply.body.startsWith(designatedHeader))) {
        const userMessage = isDirectMessage ? messageContent.replace(/^ai\s*/, "").trim() : messageContent;
        const botReplyMessage = isReplyToBot ? event.messageReply.body : "";
        const input = `${botReplyMessage}\n${userMessage}`.trim();

        if (!input) {
            api.sendMessage(`${designatedHeader}\n━━━━━━━━━━━━━━━━\nHello! How can I assist you today?\n━━━━━━━━━━━━━━━━`, event.threadID, event.messageID);
            return;
        }

        try {
            const response = await getAIResponse(input);
            api.sendMessage(`${designatedHeader}\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, event.messageID);
        } catch (error) {
            console.error("Error in onChat:", error.message);
            api.sendMessage("An error occurred while processing your request.", event.threadID);
        }
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
    onChat,
    handleCommand
};