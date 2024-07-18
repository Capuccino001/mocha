const axios = require('axios');

let lastResponseMessageID = null;

async function getAIResponse(question) {
    try {
        const services = [
            { url: 'https://zcdsphapilist.replit.app/llama', params: { query: question } },
            { url: 'https://samirxpikachuio.onrender.com/llama3', params: { prompt: question } },
            { url: 'https://openapi-idk8.onrender.com/llama', params: { query: question } }
            // Add more APIs as needed
        ];

        for (const service of services) {
            const response = await fetchFromAI(service.url, service.params);
            if (response) return response;
        }

        throw new Error("No valid response from any API");
    } catch (error) {
        console.error("Error in getAIResponse:", error.message);
        throw new Error("Failed to get response from any API");
    }
}

async function fetchFromAI(url, params = {}) {
    try {
        const { data } = await axios.get(url, { params });
        if (data && (data.generate_text || data.response)) {
            const response = data.generate_text || data.response;
            console.log("API Response:", response);
            return response;
        } else {
            throw new Error("No valid response from API");
        }
    } catch (error) {
        console.error("Network Error:", error.message);
        return null;
    }
}

module.exports = {
    config: {
        name: "llama",
        version: "1.1",
        author: "Marjhun Baylon",
        countDown: 10,
        role: 0,
        longDescription: "A conversational AI developed by Meta AI.",
        category: "ai",
        guide: {
            en: "{pn} <query>"
        }
    },
    onStart: async function ({ message, event, api, args }) {
        try {
            const prompt = args.join(" ");
            const response = await getAIResponse(prompt);

            const header = '🦙✨ | 𝙻𝚕𝚊𝚖𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━\n';
            const footer = '\n━━━━━━━━━━━━━━━━';

            // Set a success reaction
            api.setMessageReaction("✅", event.messageID, () => { }, true);

            // Reply with the response from the successful API
            message.reply({
                body: `${header}${response}${footer}`,
            });

        } catch (error) {
            console.error("Error in onStart:", error.message);

            // Set an error reaction
            api.setMessageReaction("❌", event.messageID, () => { }, true);
        }
    }
};