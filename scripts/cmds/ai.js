const axios = require('axios');

const services = [
    { url: 'https://openaikey-x20f.onrender.com/api', param: 'prompt' },
    { url: 'http://jonellccprojectapis10.adaptable.app/api/chatgpt', param: 'input' },
    { url: 'https://openapi-idk8.onrender.com/bing-balanced', param: 'query' },
    { url: 'https://openapi-idk8.onrender.com/chatter', param: 'query' },
    { url: 'https://hiroshi-rest-api.replit.app/ai/turbo', param: 'ask' },
    { url: 'https://my-api-v1.onrender.com/api/v2/gpt4', param: 'query' }
];

const designatedHeader = "🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒";

let lastResponseMessageID = null;
let conversationContext = {};

async function handleCommand(api, event, args, message) {
    const question = args.join(" ").trim();

    if (!question) {
        return message.reply("Please provide a question to get an answer.");
    }

    try {
        const { response, messageID } = await getAIResponse(question, event.senderID, event.messageID);
        lastResponseMessageID = messageID;
        api.sendMessage(`${designatedHeader}\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, messageID);
    } catch (error) {
        console.error("Error in handleCommand:", error.message);
        message.reply("An error occurred while processing your request.");
    }
}

async function getAIResponse(input, userId, messageID) {
    const query = input.trim() || "hi";
    try {
        let context = conversationContext[userId] || [];
        context.push({ role: "user", content: query });

        const response = await getAnswerFromAI(context);
        context.push({ role: "assistant", content: response });

        conversationContext[userId] = context;

        return { response, messageID };
    } catch (error) {
        console.error("Error in getAIResponse:", error.message);
        throw error;
    }
}

async function getAnswerFromAI(context) {
    const question = context.map(entry => `${entry.role}: ${entry.content}`).join("\n");

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
}

module.exports = {
    config: {
        name: 'ai',
        author: 'coffee',
        role: 0,
        category: 'ai',
        shortDescription: 'AI to answer any question',
    },
    onStart: async function ({ api, event, args }) {
        const input = args.join(' ').trim();
        try {
            const { response, messageID } = await getAIResponse(input, event.senderID, event.messageID);
            lastResponseMessageID = messageID;
            api.sendMessage(`${designatedHeader}\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, messageID);
        } catch (error) {
            console.error("Error in onStart:", error.message);
            api.sendMessage("An error occurred while processing your request.", event.threadID);
        }
    },
    onChat: async function ({ event, api }) {
        const messageContent = event.body.trim().toLowerCase();
        const isReplyToBot = event.messageReply?.senderID === api.getCurrentUserID();
        const isDirectMessage = messageContent.startsWith("ai") && event.senderID !== api.getCurrentUserID();

        if (isDirectMessage || (isReplyToBot && event.messageReply.body.startsWith(designatedHeader))) {
            const input = isDirectMessage ? messageContent.replace(/^ai\s*/, "").trim() : messageContent;
            let userContext = conversationContext[event.senderID] || [];

            if (isReplyToBot) {
                const botMessageContent = event.messageReply.body.replace(`${designatedHeader}\n━━━━━━━━━━━━━━━━\n`, "").replace("\n━━━━━━━━━━━━━━━━", "").trim();
                userContext.push({ role: "assistant", content: botMessageContent });
            }

            userContext.push({ role: "user", content: input });
            conversationContext[event.senderID] = userContext;

            try {
                const { response, messageID } = await getAIResponse(input, event.senderID, event.messageID);
                lastResponseMessageID = messageID;
                api.sendMessage(`${designatedHeader}\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, messageID);
            } catch (error) {
                console.error("Error in onChat:", error.message);
                api.sendMessage("An error occurred while processing your request.", event.threadID);
            }
        }
    },
    handleCommand // Export the handleCommand function for command-based interactions
};