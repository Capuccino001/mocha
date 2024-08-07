const axios = require('axios');

const services = [
  { url: 'https://hiroshi-rest-api.replit.app/ai/llama', param: { ask: 'ask' } }
];

const header = '🦙✨ | 𝙻𝚕𝚊𝚖𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━\n';
const footer = '\n━━━━━━━━━━━━━━━━';

async function callService(service, prompt, senderID) {
  const params = {};
  for (const [key, value] of Object.entries(service.param)) {
    params[key] = encodeURIComponent(prompt);
  }
  const queryString = new URLSearchParams(params).toString();
  try {
    const response = await axios.get(`${service.url}?${queryString}`);
    console.log('API Response:', response.data); // Log the entire response data
    return response.data;
  } catch (error) {
    console.error(`Service error from ${service.url}: ${error.message}`);
    throw new Error(`Error from ${service.url}: ${error.message}`);
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

const ArYAN = ['llama', '-llama'];

module.exports = {
  config: {
    name: 'llama',
    version: '1.0.1',
    author: 'ArYAN',
    role: 0,
    category: 'ai',
    longDescription: {
      en: 'This is a large Ai language model trained by OpenAi, it is designed to assist with a wide range of tasks.',
    },
    guide: {
      en: '\nLlama < questions >\n\n🔎 𝗚𝘂𝗶𝗱𝗲\nLlama what is capital of France?',
    },
  },

  langs: {
    en: {
      final: "",
      header: header,
      footer: footer,
    }
  },

  onStart: async function () {
    // Empty onStart function
  },

  onChat: async function ({ api, event, args, getLang, message }) {
    try {
      const prefix = ArYAN.find(p => event.body && event.body.toLowerCase().startsWith(p));
      let prompt;

      // Check if the user is replying to a bot message
      if (event.type === 'message_reply') {
        const replyMessage = event.messageReply;

        // Check if the bot's original message starts with the header
        if (replyMessage.body && replyMessage.body.startsWith(getLang("header"))) {
          // Extract the user's reply from the event
          prompt = event.body.trim();

          // Combine the user's reply with the bot's original message
          prompt = `${replyMessage.body}\n\nUser reply: ${prompt}`;
        } else {
          // If the bot's original message doesn't start with the header, return
          return;
        }
      } else if (prefix) {
        prompt = event.body.substring(prefix.length).trim() || 'hello';
      } else {
        return;
      }

      if (prompt === 'hello') {
        const greetingMessage = `${getLang("header")}Hello! How can I assist you today?\n${getLang("footer")}`;
        api.sendMessage(greetingMessage, event.threadID, event.messageID);
        console.log('Sent greeting message as a reply to user');
        return;
      }

      try {
        const fastestAnswer = await getFastestValidAnswer(prompt, event.senderID);
        console.log('Final Answer:', fastestAnswer); // Log the final answer before sending

        // Extract the response text from the API's JSON and send it with header and footer
        const responseText = fastestAnswer.response || 'No response from API.';
        const finalMsg = `${header}${responseText}${footer}`;
        api.sendMessage(finalMsg, event.threadID, event.messageID);

        console.log('Sent answer as a reply to user');
      } catch (error) {
        console.error(`Failed to get answer: ${error.message}`);
        const errorMsg = `${header}Error: ${error.message}${footer}`;
        api.sendMessage(errorMsg, event.threadID, event.messageID);
      }
    } catch (error) {
      console.error(`Failed to process chat: ${error.message}`);
      const errorMsg = `${header}Error: ${error.message}${footer}`;
      api.sendMessage(errorMsg, event.threadID, event.messageID);
    }
  }
};