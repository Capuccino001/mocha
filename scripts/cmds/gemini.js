const axios = require('axios');

// In-memory store for conversation context
const conversationContext = new Map();

const header = "👩‍💻 | 𝙶𝚎𝚖𝚒𝚗𝚒 |\n━━━━━━━━━━━━━━━━\n";
const footer = "━━━━━━━━━━━━━━━━";

async function getAIResponse(prompt, userID, context) {
  try {
    const response = await axios.get('https://gemini-ai-pearl-two.vercel.app/kshitiz', {
      params: {
        prompt: encodeURIComponent(prompt),
        uid: userID,
        apikey: 'kshitiz',
        context: encodeURIComponent(context) // Send context to AI
      }
    });
    return response.data.answer;
  } catch (error) {
    console.error("Error fetching AI response:", error.message);
    throw new Error(`Error fetching AI response: ${error.message}`);
  }
}

async function describeImage(prompt, photoUrl) {
  try {
    const url = `https://sandipbaruwal.onrender.com/gemini2?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(photoUrl)}`;
    const response = await axios.get(url);
    return response.data.answer;
  } catch (error) {
    console.error("Error fetching image description:", error.message);
    throw new Error(`Error fetching image description: ${error.message}`);
  }
}

async function handleCommand({ api, message, event, args }) {
  try {
    const senderID = event.senderID;
    const userInput = args.join(" ").trim();
    const previousContext = conversationContext.get(senderID) || "";

    if (!userInput) {
      return message.reply(`${header}Please provide a prompt.${footer}`);
    }

    if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
      const photoUrl = event.messageReply.attachments[0].url;
      const description = await describeImage(userInput, photoUrl);
      return message.reply(`${header}Description: ${description}${footer}`);
    }

    const aiResponse = await getAIResponse(userInput, senderID, previousContext);
    message.reply(`${header}${aiResponse}${footer}`, (error, info) => {
      if (error) {
        console.error("Error setting reply listener:", error.message);
      } else {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: config.name,
          uid: senderID 
        });
      }
    });

    // Update conversation context
    conversationContext.set(senderID, `${previousContext} ${userInput} ${aiResponse}`);

  } catch (error) {
    console.error("Error in handleCommand:", error.message);
    message.reply(`${header}Error: ${error.message}${footer}`);
  }
}

async function handleReply({ api, message, event }) {
  try {
    const senderID = event.senderID;
    const userInput = event.body;
    const previousContext = conversationContext.get(senderID) || "";

    const aiResponse = await getAIResponse(userInput, senderID, previousContext);
    message.reply(`${header}${aiResponse}${footer}`);

    // Update conversation context
    conversationContext.set(senderID, `${previousContext} ${userInput} ${aiResponse}`);
  } catch (error) {
    console.error("Error in handleReply:", error.message);
    message.reply(`${header}Error: ${error.message}${footer}`);
  }
}

const config = {
  name: "gemini",
  aliases: ["gemini"],
  version: "4.0",
  author: "vex_kshitiz",
  countDown: 5,
  role: 0,
  longDescription: "Chat with gemini",
  category: "ai",
  guide: {
    en: "{p}gemini {prompt}"
  }
};

module.exports = {
  config,
  handleCommand,
  onStart: handleCommand,
  onReply: handleReply // Handle replies to the bot's messages
};