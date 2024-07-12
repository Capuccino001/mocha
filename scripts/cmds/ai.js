const axios = require('axios');
const NodeCache = require('node-cache');

// Initialize cache
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const services = [
    { url: 'https://openaikey-x20f.onrender.com/api', param: 'prompt' },
    { url: 'http://nash-rest-api.replit.app/gpt4', param: 'query' },
    { url: 'https://samirxpikachu.onrender.com/gpt', param: 'prompt' },
    { url: 'http://jonellccprojectapis10.adaptable.app/api/chatgpt', param: 'input' },
    { url: 'https://openapi-idk8.onrender.com/bing-balanced', param: 'query' },
    { url: 'https://openapi-idk8.onrender.com/chatter', param: 'query' },
    { url: 'http://markdevs-last-api.onrender.com/api/v2/gpt4', param: 'query' },
    { url: 'https://markdevs-last-api.onrender.com/api/v3/gpt4', param: 'ask' },
    { url: 'https://markdevs-last-api.onrender.com/gpt4', param: 'prompt' }
];

const designatedHeader = "🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒";

const getAIResponse = async (question, messageID) => {
    const cachedResponse = cache.get(question);
    if (cachedResponse) {
        return { response: cachedResponse, messageID };
    }

    try {
        const { response, service } = await tryAllServices(question);
        if (response) {
            cache.set(question, response);
            return { response, messageID };
        } else {
            throw new Error("No valid response from any AI service");
        }
    } catch (error) {
        console.error("Error in getAIResponse:", error.message);
        throw new Error("An error occurred while processing your request.");
    }
};

const tryAllServices = async (question) => {
    const promises = services.map(({ url, param }) => fetchFromAI(url, { [param]: question }));

    const responses = await Promise.allSettled(promises);
    for (const { status, value } of responses) {
        if (status === 'fulfilled' && value) {
            return { response: value, service: services[responses.indexOf({ status, value })] };
        }
    }

    return { response: null, service: null };
};

const fetchFromAI = async (url, params) => {
    try {
        const { data } = await axios.get(url, { params });
        return data.gpt4 || data.reply || data.response || data.answer || data.message;
    } catch (error) {
        console.error(`Network Error fetching from ${url}:`, error.message);
        return null;
    }
};

const handleCommand = async (api, event, args, message) => {
    try {
        const question = args.join(" ").trim();
        if (!question) {
            throw new Error("Please provide a question to get an answer.");
        }

        const { response, messageID } = await getAIResponse(question, event.messageID);
        api.sendMessage(`🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, messageID);
    } catch (error) {
        console.error("Error in handleCommand:", error.message);
        api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
};

const onStart = async ({ api, event, args }) => {
    try {
        const input = args.join(' ').trim();
        if (!input) {
            throw new Error("Please provide input to start.");
        }

        const { response, messageID } = await getAIResponse(input, event.messageID);
        api.sendMessage(`🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, messageID);
    } catch (error) {
        console.error("Error in onStart:", error.message);
        api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
};

const onChat = async ({ event, api }) => {
    const messageContent = event.body.trim().toLowerCase();
    const isReplyToBot = event.messageReply && event.messageReply.senderID === api.getCurrentUserID();
    const isDirectMessage = messageContent.startsWith("ai") && event.senderID !== api.getCurrentUserID();

    // Process direct messages starting with "ai" or replies to the bot with the designated header
    if (isDirectMessage || (isReplyToBot && event.messageReply.body.startsWith(designatedHeader))) {
        const userMessage = isDirectMessage ? messageContent.replace(/^ai\s*/, "").trim() : messageContent;
        const botReplyMessage = isReplyToBot ? event.messageReply.body : "";
        const input = `${botReplyMessage}\n${userMessage}`.trim();

        try {
            const { response, messageID } = await getAIResponse(input, event.messageID);
            api.sendMessage(`🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, messageID);
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