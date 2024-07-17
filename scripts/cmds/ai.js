const axios = require('axios');

const conversationContext = {};
const botUID = '61561393752978';

async function gptChatService2(prompt, senderID) {
  try {
    const response = await axios.get(`https://gpt-four.vercel.app/gpt?prompt=${encodeURIComponent(prompt)}&uid=${senderID}`);
    return response.data.answer;
  } catch (error) {
    throw new Error(`Service2 Error: ${error.message}`);
  }
}

async function gptChatService3(prompt) {
  try {
    const response = await axios.get(`https://markdevs-last-api.onrender.com/api/v3/gpt4?ask=${encodeURIComponent(prompt)}`);
    return response.data;
  } catch (error) {
    throw new Error(`Service3 Error: ${error.message}`);
  }
}

const ArYAN = ['ai'];

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
      en: '\nAi < questions >\n\n🔎 𝗚𝘂𝗶𝗱𝗲\nAi what is capital of France?',
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

  onStart: async function () {},
  onChat: async function ({ api, event, args, getLang, message }) {
    try {
      const prefix = ArYAN.find((p) => event.body && event.body.toLowerCase().startsWith(p));
      let prompt;

      if (prefix) {
        prompt = event.body.substring(prefix.length).trim() || 'hello';
      } else {
        // If no prefix, consider it as a continuation of the previous conversation only if it's a direct reply to the bot's UID
        const previousContext = conversationContext[event.threadID];
        if (previousContext && event.messageReply && event.messageReply.senderID === botUID) {
          prompt = `${previousContext.context} ${event.body.trim()}`;
        } else {
          // If no previous context or not a direct reply to the bot's UID, ignore the message
          return;
        }
      }

      const loadingMessage = getLang("loading");
      const loadingReply = await message.reply(loadingMessage);

      if (prompt === 'hello') {
        const greetingMessage = `${getLang("header")}\nHello! How can I assist you today?\n${getLang("footer")}`;
        api.editMessage(greetingMessage, loadingReply.messageID);
        console.log('Sent greeting message as a reply to user');
        return;
      }

      let fastestAnswer;
      try {
        fastestAnswer = await gptChatService2(prompt, event.senderID);
      } catch (error) {
        console.log(`Service2 failed: ${error.message}. Trying Service3...`);
        fastestAnswer = await gptChatService3(prompt);
      }

      // Update the conversation context
      const finalMsg = `${getLang("header")}\n${fastestAnswer}\n${getLang("footer")}`;
      await api.editMessage(finalMsg, loadingReply.messageID);

      // Track the final reply message context for continuous conversation
      conversationContext[event.threadID] = {
        context: fastestAnswer,
      };

      console.log('Sent answer as a reply to user');
    } catch (error) {
      console.error(`Failed to get answer: ${error.message}`);
      api.sendMessage(
        `${error.message}.`,
        event.threadID
      );
    }
  },

  onMessageReply: async function ({ api, event, getLang, message }) {
    try {
      const previousContext = conversationContext[event.threadID];
      if (!previousContext || event.messageReply.senderID !== botUID) {
        return;
      }

      let prompt = event.body.trim();

      // Include the previous context in the prompt
      prompt = `${previousContext.context} ${prompt}`;

      const loadingMessage = getLang("loading");
      const loadingReply = await message.reply(loadingMessage);

      let fastestAnswer;
      try {
        fastestAnswer = await gptChatService2(prompt, event.senderID);
      } catch (error) {
        console.log(`Service2 failed: ${error.message}. Trying Service3...`);
        fastestAnswer = await gptChatService3(prompt);
      }

      // Update the conversation context
      conversationContext[event.threadID] = {
        context: fastestAnswer,
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
  }
};