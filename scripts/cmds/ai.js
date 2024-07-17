const axios = require('axios');

async function gptChatService1(prompt) {
  try {
    const response = await axios.get(`https://global-sprak.onrender.com/api/gpt?prompt=${encodeURIComponent(prompt)}`);
    return response.data.answer;
  } catch (error) {
    throw error;
  }
}

async function gptChatService2(prompt, senderID) {
  try {
    const response = await axios.get(`https://gpt-four.vercel.app/gpt?prompt=${encodeURIComponent(prompt)}&uid=${senderID}`);
    return response.data.answer;
  } catch (error) {
    throw error;
  }
}

async function gptChatService3(prompt) {
  try {
    const response = await axios.get(`https://markdevs-last-api.onrender.com/api/v3/gpt4?ask=${encodeURIComponent(prompt)}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

const ArYAN = [
  'ai',
];

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

      if (!prefix) {
        return;
      }

      let prompt = event.body.substring(prefix.length).trim() || 'hello';

      const loadingMessage = getLang("loading");
      const loadingReply = await message.reply(loadingMessage);

      if (prompt === 'hello') {
        const greetingMessage = `${getLang("header")}\nHello! How can I assist you today?\n${getLang("footer")}`;
        api.editMessage(greetingMessage, loadingReply.messageID);
        console.log('Sent greeting message as a reply to user');
        return;
      }

      // Call all three APIs concurrently and choose the fastest response
      const [answerFromService1, answerFromService2, answerFromService3] = await Promise.all([
        gptChatService1(prompt),
        gptChatService2(prompt, event.senderID),
        gptChatService3(prompt),
      ]);

      // Determine which response came first and use that
      let fastestAnswer = answerFromService1;
      if (answerFromService2.length < fastestAnswer.length) {
        fastestAnswer = answerFromService2;
      }
      if (answerFromService3.length < fastestAnswer.length) {
        fastestAnswer = answerFromService3;
      }

      const finalMsg = `${getLang("header")}\n${fastestAnswer}\n${getLang("footer")}`;
      api.editMessage(finalMsg, loadingReply.messageID);

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