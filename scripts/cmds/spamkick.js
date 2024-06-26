let messageCounts = {};
const spamThreshold = 3;
const spamInterval = 20000; // Adjusted to 40 seconds
const exemptedUserID = "100005954550355"; // UID to exempt from kick

module.exports = {
  config: {
    name: "spamkick",
    aliases: [],
    version: "1.0",
    author: "Jonell Magallanes & BLUE & kshitiz",
    countDown: 5,
    role: 0,
    shortDescription: "Automatically detect and act on spam",
    longDescription: "Automatically detect and act on spam",
    category: "owner",
    guide: "{pn}",
  },

  onStart: async function ({ api, event, args }) {
    api.sendMessage("This command functionality kicks the user when they are spamming in group chats", event.threadID, event.messageID);
  },

  onChat: function ({ api, event }) {
    const { threadID, messageID, senderID } = event;

    // Check if the sender is exempted from kick
    if (senderID === exemptedUserID) {
      return; // Do nothing if exempted user sends messages
    }

    if (!messageCounts[threadID]) {
      messageCounts[threadID] = {};
    }

    if (!messageCounts[threadID][senderID]) {
      messageCounts[threadID][senderID] = {
        count: 1,
        timer: setTimeout(() => {
          delete messageCounts[threadID][senderID];
        }, spamInterval),
      };
    } else {
      messageCounts[threadID][senderID].count++;

      if (messageCounts[threadID][senderID].count > spamThreshold) {
        clearTimeout(messageCounts[threadID][senderID].timer);
        api.sendMessage("🛡️ | Detected spamming. The bot will remove the user from the group", threadID, messageID);
        
        api.removeUserFromGroup(senderID, threadID, (err) => {
          if (err) {
            console.error(`Failed to remove user ${senderID} from thread ${threadID}:`, err);
          }
        });

        delete messageCounts[threadID][senderID];
      }
    }

    // Reset the timer for the current user after each message
    clearTimeout(messageCounts[threadID][senderID].timer);
    messageCounts[threadID][senderID].timer = setTimeout(() => {
      delete messageCounts[threadID][senderID];
    }, spamInterval);
  },
};