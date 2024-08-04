const { getStreamFromURL } = global.utils;

module.exports = {
    config: {
        name: "antichangeinfobox",
        version: "1.1",
        author: "coffee",
        description: {
            en: "Monitors thread property changes, saves initial settings, detects unauthorized changes, warns users, kicks offenders, and reverts changes."
        },
        category: "utility"
    },

    onStart: async ({ api, threadsData, isRestart }) => {
        try {
            const threadList = await api.getThreadList(100, null, ["INBOX"]);
            await Promise.all(threadList.map(async (thread) => {
                const { threadID } = thread;
                const threadInfo = await api.getThreadInfo(threadID);
                
                // Extract current settings
                const initialSettings = {
                    avatar: threadInfo.imageSrc || null,
                    name: threadInfo.threadName || null,
                    theme: threadInfo.color || null, // Adjust if needed for theme
                    emoji: threadInfo.emoji || null  // Adjust if needed for emoji
                };

                await threadsData.set(threadID, initialSettings, "data.antiChangeInfoBox");
            }));

            console.log("Thread properties initialized successfully.");
        } catch (error) {
            console.error("Error initializing thread properties:", error);
        }
    },

    onEvent: async ({ api, event, threadsData, role }) => {
        const { threadID, logMessageType, logMessageData, author } = event;

        const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
        if (!dataAntiChange) return;

        const revertChanges = async (property, newValue) => {
            switch (property) {
                case "avatar":
                    await api.changeGroupImage(await getStreamFromURL(newValue), threadID);
                    break;
                case "name":
                    await api.setTitle(newValue, threadID);
                    break;
                case "theme":
                    await api.changeThreadColor(newValue || "196241301102133", threadID); // Default color
                    break;
                case "emoji":
                    await api.changeThreadEmoji(newValue, threadID);
                    break;
            }
        };

        try {
            switch (logMessageType) {
                case "log:thread-image":
                    if (role < 1 && api.getCurrentUserID() !== author) {
                        api.sendMessage("Unauthorized change detected in thread avatar. The bot will remove the user from the group.", threadID);
                        await kickUser(api, author, threadID);
                        await revertChanges("avatar", dataAntiChange.avatar);
                    } else {
                        const newImageSrc = logMessageData.url;
                        if (newImageSrc) await threadsData.set(threadID, newImageSrc, "data.antiChangeInfoBox.avatar");
                    }
                    break;

                case "log:thread-name":
                    if (role < 1 && api.getCurrentUserID() !== author) {
                        api.sendMessage("Unauthorized change detected in thread name. The bot will remove the user from the group.", threadID);
                        await kickUser(api, author, threadID);
                        await revertChanges("name", dataAntiChange.name);
                    } else {
                        const newThreadName = logMessageData.name;
                        if (newThreadName) await threadsData.set(threadID, newThreadName, "data.antiChangeInfoBox.name");
                    }
                    break;

                case "log:thread-color":
                    if (role < 1 && api.getCurrentUserID() !== author) {
                        api.sendMessage("Unauthorized change detected in thread theme. The bot will remove the user from the group.", threadID);
                        await kickUser(api, author, threadID);
                        await revertChanges("theme", dataAntiChange.theme);
                    } else {
                        const newThreadThemeID = logMessageData.theme_id;
                        if (newThreadThemeID) await threadsData.set(threadID, newThreadThemeID, "data.antiChangeInfoBox.theme");
                    }
                    break;

                case "log:thread-icon":
                    if (role < 1 && api.getCurrentUserID() !== author) {
                        api.sendMessage("Unauthorized change detected in thread emoji. The bot will remove the user from the group.", threadID);
                        await kickUser(api, author, threadID);
                        await revertChanges("emoji", dataAntiChange.emoji);
                    } else {
                        const newThreadEmoji = logMessageData.thread_icon;
                        if (newThreadEmoji) await threadsData.set(threadID, newThreadEmoji, "data.antiChangeInfoBox.emoji");
                    }
                    break;
            }
        } catch (error) {
            console.error("Error handling thread property changes:", error);
        }
    }
};

async function kickUser(api, userID, threadID) {
    try {
        await api.removeUserFromGroup(userID, threadID);
        console.log("User removed successfully.");
    } catch (error) {
        console.error("Error removing user from group:", error);
    }
}