const { getStreamFromURL, uploadImgbb } = global.utils;

module.exports = {
    config: {
        name: "antichangeinfobox",
        version: "1.0",
        author: "NTKhang",
        description: {
            en: "Automatically kicks out the user if unauthorized changes are detected in thread properties (name, avatar, theme, emoji).",
        },
        category: "utility"
    },

    onStart: async ({ api, event, threadsData, isRestart }) => {
        try {
            if (isRestart) {
                // Bot has restarted
                const threadList = await api.getThreadList(100, null, ["INBOX"]);
                await Promise.all(threadList.map(async (thread) => {
                    const { threadID } = thread;
                    const threadInfo = await api.getThreadInfo(threadID);
                    const dataAntiChangeInfoBox = {
                        avatar: threadInfo.imageSrc || null,
                        name: threadInfo.threadName || null,
                        theme: threadInfo.color || null,
                        emoji: threadInfo.emoji || null
                    };

                    await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
                }));

                console.log("Thread properties saved successfully after bot restart.");
            } else {
                // Bot is starting for the first time
                console.log("Bot started for the first time. Initializing thread properties.");

                // Fetch initial thread properties and save them
                const threadList = await api.getThreadList(100, null, ["INBOX"]);
                await Promise.all(threadList.map(async (thread) => {
                    const { threadID } = thread;
                    const threadInfo = await api.getThreadInfo(threadID);
                    const dataAntiChangeInfoBox = {
                        avatar: threadInfo.imageSrc || null,
                        name: threadInfo.threadName || null,
                        theme: threadInfo.color || null,
                        emoji: threadInfo.emoji || null
                    };

                    await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
                }));

                console.log("Thread properties initialized successfully.");
            }
        } catch (error) {
            console.error("Error handling bot start/restart and saving thread properties: ", error);
        }
    },

    onEvent: async ({ api, event, threadsData, role }) => {
        const { threadID, logMessageType, author } = event;

        if (role < 1 && api.getCurrentUserID() !== author) {
            // Unauthorized change detected
            try {
                switch (logMessageType) {
                    case "log:thread-image":
                        api.sendMessage("🛡️ | Unauthorized change detected in thread avatar. The bot will remove the user from the group.", threadID);
                        await kickUser(api, author, threadID);
                        break;
                    case "log:thread-name":
                        api.sendMessage("🛡️ | Unauthorized change detected in thread name. The bot will remove the user from the group.", threadID);
                        await kickUser(api, author, threadID);
                        break;
                    case "log:thread-color":
                        api.sendMessage("🛡️ | Unauthorized change detected in thread theme. The bot will remove the user from the group.", threadID);
                        await kickUser(api, author, threadID);
                        break;
                    case "log:thread-icon":
                        api.sendMessage("🛡️ | Unauthorized change detected in thread emoji. The bot will remove the user from the group.", threadID);
                        await kickUser(api, author, threadID);
                        break;
                }
            } catch (error) {
                console.error("Error handling unauthorized change:", error);
            }
        }
    }
};

async function kickUser(api, author, threadID) {
    await api.removeUserFromGroup(author, threadID);
    console.log("User removed successfully.");
}