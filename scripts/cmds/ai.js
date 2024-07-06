const axios = require('axios');

const forbiddenKeywords = ["-unsend", "-remini", "-removebg","-uid"];
const services = [
    
{ url: 'http://markdevs-last-api.onrender.com/api/v2/gpt4', param: 'query' },    
{ url: 'https://markdevs-last-api.onrender.com/api/v3/gpt4', param: 'ask' },    
{ url: 'https://openaikey-x20f.onrender.com/api', param: 'prompt' },    
{ url: 'http://nash-rest-api.replit.app/gpt4', param: 'query' },    
{ url: 'https://samirxpikachu.onrender.com/gpt', param: 'prompt' },    
{ url: 'http://jonellccprojectapis10.adaptable.app/api/chatgpt', param: 'input' },    
{ url: 'https://openapi-idk8.onrender.com/bing-balanced', param: 'query' },    
{ url: 'https://openapi-idk8.onrender.com/chatter', param: 'query' }

];

const getAIResponse = async (question, messageID) => {
    const response = await getAnswerFromAI(question.trim() || "hi");
    return { response, messageID };
};

const getAnswerFromAI = async (question) => {
    for (const { url, param } of services) {
        const params = { [param]: question };
        const response = await fetchFromAI(url, params);
        if (response) return response;
    }
    throw new Error("No valid response from any AI service");
};

const fetchFromAI = async (url, params) => {
    try {
        const { data } = await axios.get(url, { params });
        return data.gpt4 || data.reply || data.response || data.answer || data.message;
    } catch (error) {
        console.error("Network Error:", error.message);
        return null;
    }
};

const handleCommand = async (api, event, args, message) => {
    try {
        const question = args.join(" ").trim();
        if (!question) return message.reply("Please provide a question to get an answer.");
        const { response, messageID } = await getAIResponse(question, event.messageID);
        api.sendMessage(`🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, messageID);
    } catch (error) {
        console.error("Error in handleCommand:", error.message);
        message.reply("An error occurred while processing your request.");
    }
};

const onStart = async ({ api, event, args }) => {
    try {
        const input = args.join(' ').trim();
        const { response, messageID } = await getAIResponse(input, event.messageID);
        api.sendMessage(`🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, messageID);
    } catch (error) {
        console.error("Error in onStart:", error.message);
        api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
};

const onChat = async ({ event, api }) => {
    const messageContent = event.body.trim().toLowerCase();
    if (forbiddenKeywords.some(keyword => messageContent.includes(keyword))) return;

    const isReplyToBot = event.messageReply && event.messageReply.senderID === api.getCurrentUserID();
    const isDirectMessage = messageContent.startsWith("ai") && event.senderID !== api.getCurrentUserID();

    if (isReplyToBot || isDirectMessage) {
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
