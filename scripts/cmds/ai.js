const axios = require('axios');

const ArYAN = ['ai'];
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
    version: '1.0.1',
    author: 'ArYAN',
    role: 0,
    category: 'ai',
    longDescription: {
      en: 'This is a large AI language model trained by OpenAI, designed to assist with a wide range of tasks.',
    },
    guide: {
      en: '\nAi < questions >\n\n🔎 𝗚𝘂𝗶𝗱𝗲\nAi what is the capital of France?',
    },
  },

  langs: {
    en: {
      final: "",
      loading: 'Answering your question, please wait...',
    }
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

  onChat: async function ({ api, event, args, getLang, message }) {
    try {
      const prefix = ArYAN.find(p => event.body?.toLowerCase().startsWith(p));

      if (!prefix) return;

      const input = event.body.substring(prefix.length).trim() || 'hello';

      const loadingMessage = getLang("loading");
      const loadingReply = await message.reply(loadingMessage);

      if (input === 'hello') {
        api.editMessage("🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━\nHello! How can I assist you today?\n━━━━━━━━━━━━━━━━", loadingReply.messageID);
        console.log('Sent greeting message as a reply to user');
        return;
      }

      let userContext = conversationContext[event.senderID] || [];

      userContext.push({ role: "user", content: input });
      conversationContext[event.senderID] = userContext;

      const { response, messageID } = await getAIResponse(input, event.senderID, event.messageID);
      lastResponseMessageID = messageID;
      api.editMessage(`${designatedHeader}\n━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━`, loadingReply.messageID);
      console.log('Sent answer as a reply to user');
    } catch (error) {
      console.error(`Failed to get answer: ${error.message}`);
      api.sendMessage(`${error.message}.`, event.threadID);
    }
  }
};