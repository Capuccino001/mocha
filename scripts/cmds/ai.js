const axios = require('axios');

// Define a variable to store the context of ongoing conversations
let context = {};

async function handleCommand(api, event, args, message) {
    try {
        const question = args.join(" ").trim();

        if (!question) {
            return message.reply("Failed to get an answer. Please try again later.");
        }

        const response = await getAnswerFromAI(question);

        if (response) {
            // Store the context for future continuation
            context[event.threadID] = { query: question, lastResponse: response };
            message.reply(response);
        } else {
            message.reply("Failed to get an answer. Please try again later.");
        }
    } catch (error) {
        console.error("Error in handleCommand:", error.message);
        message.reply("An error occurred while processing your request.");
    }
}

async function getAnswerFromAI(question) {
    try {
        const services = [
            { url: 'https://markdevs-last-api.onrender.com/gpt4', params: { prompt: question, uid: '100005954550355' } },
            { url: 'http://markdevs-last-api.onrender.com/api/v2/gpt4', params: { query: question } },
            { url: 'https://markdevs-last-api.onrender.com/api/v3/gpt4', params: { ask: question } },
            { url: 'https://openaikey-x20f.onrender.com/api', params: { prompt: question } },
            { url: 'http://nash-rest-api.replit.app/gpt4', params: { query: question } },
            { url: 'https://samirxpikachu.onrender.com/gpt/zero', params: { prompt: question } },
            { url: 'http://jonellccprojectapis10.adaptable.app/api/chatgpt', params: { input: question } },
            { url: 'https://openapi-idk8.onrender.com/bing-balanced', params: { query: question } },
            { url: 'https://openapi-idk8.onrender.com/chatter', params: { query: question } },
            { url: 'http://zcdsphapilist.replit.app/gpt4', params: { query: question } }
        ];

        for (const service of services) {
            const data = await fetchFromAI(service.url, service.params);
            if (data) return data;
        }

        throw new Error("No valid response from any AI service");
    } catch (error) {
        console.error("Error in getAnswerFromAI:", error.message);
        throw new Error("Failed to get AI response");
    }
}

async function fetchFromAI(url, params) {
    try {
        const { data } = await axios.get(url, { params });
        if (data && (data.gpt4 || data.reply || data.response || data.answer || data.message)) {
            const response = data.gpt4 || data.reply || data.response || data.answer || data.message;
            console.log("AI Response:", response);
            return response;
        } else {
            throw new Error("No valid response from AI");
        }
    } catch (error) {
        console.error("Network Error:", error.message);
        return null; // Returning null to handle retry logic or error handling in getAnswerFromAI
    }
}

async function getAIResponse(input, userId, messageID, threadID) {
    const query = input.trim() || "hi";
    try {
        const response = await getAnswerFromAI(query);
        return { response, messageID };
    } catch (error) {
        console.error("Error in getAIResponse:", error.message);
        throw error;
    }
}

async function onChat({ event, message, api }) {
    const messageContent = event.body.trim().toLowerCase();

    try {
        // Check if the message is a reply to the AI response and continue the conversation
        if (event.isGroup && event.type === "message_reply") {
            const repliedMessage = await api.getMessage(event.messageReply.replyToMessageID);
            const originalMessageContent = repliedMessage.body.trim().toLowerCase();
            
            // Continue with the last query and its response if available in context
            if (context[event.threadID]) {
                const { query, lastResponse } = context[event.threadID];
                const { response, messageID } = await getAIResponse(originalMessageContent, event.senderID, message.messageID, event.threadID);
                
                // Send the AI response and update context with the latest response
                message.reply(`🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, messageID);
                context[event.threadID].lastResponse = response;
            }
        }
        
        // Check if the message starts with "ai" to initiate a new query
        else if (messageContent.startsWith("ai")) {
            const input = messageContent.replace(/^gpt\s*/, "").trim();
            const { response, messageID } = await getAIResponse(input, event.senderID, message.messageID, event.threadID);
            
            // Store the context for future continuation
            context[event.threadID] = { query: input, lastResponse: response };
            message.reply(`🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, messageID);
        }
        
        // Normal replies should update the context with the latest response
        else if (context[event.threadID]) {
            const { query, lastResponse } = context[event.threadID];
            const { response, messageID } = await getAIResponse(messageContent, event.senderID, message.messageID, event.threadID);
            
            // Send the AI response and update context with the latest response
            message.reply(`🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, messageID);
            context[event.threadID].lastResponse = response;
        }
    } catch (error) {
        console.error("Error in onChat:", error.message);
        message.reply("An error occurred while processing your request.");
    }
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
            const { response, messageID } = await getAIResponse(input, event.senderID, event.messageID, event.threadID);
            // Store the context for future continuation
            context[event.threadID] = { query: input, lastResponse: response };
            api.sendMessage(`🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, event.threadID, messageID);
        } catch (error) {
            console.error("Error in onStart:", error.message);
            api.sendMessage("An error occurred while processing your request.", event.threadID);
        }
    },
    onChat,
    handleCommand
};