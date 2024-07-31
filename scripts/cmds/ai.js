const axios = require('axios');

const conversationContext = {};
const contextTTL = 30 * 60 * 1000; // 30 minutes

const services = [
  { url: 'https://markdevs-last-api.onrender.com/api/v3/gpt4', param: { ask: 'ask' } },
  { url: 'https://king-aryanapis.onrender.com/api/gpt', param: { prompt: 'prompt' } },
  { url: 'https://gpt-four.vercel.app/gpt', param: { prompt: 'prompt' }, isCustom: true }
];

async function callService(service, prompt, senderID) {
  if (service.isCustom) {
    // Special handling for custom service
    try {
      const response = await axios.get(`${service.url}?${service.param.prompt}=${encodeURIComponent(prompt)}`);
      return response.data.answer || response.data;
    } catch (error) {
      console.error(`Custom service error from ${service.url}: ${error.message}`);
      throw new Error(`Error from ${service.url}: ${error.message}`);
    }
  } else {
    // Original handling for standard services
    const params = {};
    for (const [key, value] of Object.entries(service.param)) {
      params[key] = key === 'uid' ? senderID : encodeURIComponent(prompt);
    }
    const queryString = new URLSearchParams(params).toString();
    try {
      const response = await axios.get(`${service.url}?${queryString}`);
      return response.data.answer || response.data;
    } catch (error) {
      console.error(`Service error from ${service.url}: ${error.message}`);
      throw new Error(`Error from ${service.url}: ${error.message}`);
    }
  }
}

async function getFastestValidAnswer(prompt, senderID) {
  const promises = services.map(service => callService(service, prompt, senderID));
  const results = await Promise.allSettled(promises);
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }
  throw new Error('All services failed to provide a valid answer');
}

function cleanUpOldContexts() {
  const now = Date.now();
  for (const [threadID, context] of Object.entries(conversationContext)) {
    if (now - context.timestamp > contextTTL) {
      delete conversationContext[threadID];
    }
  }
}

const ArYAN = ['ai', '-ai'];

module.exports = {
  config: {
    name: 'ai',
    version: '1.0.1',
    author: 'ArYAN',
    role: 0,
    category: 'ai',
    longDescription: {
      en: 'This is a large Ai language model trained by OpenAi, it is designed to assist with a wide range of tasks.',
    },
    guide: {
      en: '\nAi < questions >\n\n🔎 𝗚𝘂𝗂𝗱𝗲\nAi what is capital of France?',
    },
  },

  langs: {
    en: {
      final: "",
      loading: '𝖠𝗇𝗌𝗐𝖾𝗋𝗂𝗇𝗀 𝗒𝗈𝗎𝗋 𝗊𝗎𝖾𝗌𝗍𝗂𝗈𝗇 𝗉𝗅𝖾𝖺𝗌𝖾 𝗐𝖺𝗂𝗍...',
      header: "🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━",
      footer: "━━━━━━━━━━━━━━━━",
    }
  },

  onStart: async function () {
    cleanUpOldContexts();
  },

  onChat: async function ({ api, event, args, getLang, message }) {
    try {
      const prefix = ArYAN.find(p => event.body && event.body.toLowerCase().startsWith(p));
      let prompt;

      if (prefix) {
        prompt = event.body.substring(prefix.length).trim() || 'hello';
      } else {
        const previousContext = conversationContext[event.threadID];
        if (previousContext && event.messageReply && event.messageReply.senderID) {
          prompt = `${previousContext.context} ${event.body.trim()}`;
        } else {
          return;
        }
      }

      const loadingMessage = getLang("loading");
      const loadingReply = await message.reply(loadingMessage);
      const botUID = loadingReply.senderID; // Get the bot's UID from the loading message

      if (prompt === 'hello') {
        const greetingMessage = `${getLang("header")}\nHello! How can I assist you today?\n${getLang("footer")}`;
        api.editMessage(greetingMessage, loadingReply.messageID);
        console.log('Sent greeting message as a reply to user');
        return;
      }

      try {
        const fastestAnswer = await getFastestValidAnswer(prompt, event.senderID);

        const finalMsg = `${getLang("header")}\n${fastestAnswer}\n${getLang("footer")}`;
        await api.editMessage(finalMsg, loadingReply.messageID);

        conversationContext[event.threadID] = {
          context: fastestAnswer,
          botUID: botUID,
          timestamp: Date.now() // Add timestamp to manage context TTL
        };

        console.log('Sent answer as a reply to user');
      } catch (error) {
        console.error(`Failed to get answer: ${error.message}`);
        api.sendMessage(
          `${error.message}.`,
          event.threadID
        );
      }
    } catch (error) {
      console.error(`Failed to process chat: ${error.message}`);
      api.sendMessage(
        `${error.message}.`,
        event.threadID
      );
    }
  },

  onMessageReply: async function ({ api, event, getLang, message }) {
    try {
      const previousContext = conversationContext[event.threadID];
      if (!previousContext || event.messageReply.senderID !== previousContext.botUID) {
        return;
      }

      let prompt = event.body.trim();
      prompt = `${previousContext.context} ${prompt}`;

      const loadingMessage = getLang("loading");
      const loadingReply = await message.reply(loadingMessage);

      try {
        const fastestAnswer = await getFastestValidAnswer(prompt, event.senderID);

        conversationContext[event.threadID] = {
          context: fastestAnswer,
          botUID: previousContext.botUID,
          timestamp: Date.now() // Update timestamp to manage context TTL
        };

        const finalMsg = `${getLang("header")}\n${fastestAnswer}\n${getLang("footer")}`;
        await api.editMessage(finalMsg, loadingReply.messageID);

        console.log('Sent answer as a reply to user');
      } catch (error) {
        console.error(`Failed to get answer: ${error.message}`);
        api.sendMessage(
          `${error.message}.`,
          event.threadID
        );
      }
    } catch (error) {
      console.error(`Failed to process message reply: ${error.message}`);
      api.sendMessage(
        `${error.message}.`,
        event.threadID
      );
    }
  }
};