const { getStreamFromURL, uploadImgbb } = global.utils;

module.exports = {
    config: {
        name: "antichangeinfobox",
        version: "1.0",
        author: "NTKhang",
        description: {
            en: "Automatically reverts thread properties (name, nickname, theme, emoji) on unauthorized changes and kicks out the user.",
            vi: "Tự động khôi phục các thuộc tính của nhóm (tên, biệt danh, chủ đề, biểu tượng cảm xúc) khi phát hiện thay đổi trái phép và đuổi thành viên ra khỏi nhóm."
        },
        category: "utility"
    },

    onStart: async function ({ api, event, threadsData, isRestart }) {
        try {
            if (isRestart) {
                // Bot has restarted
                const threadList = await api.getThreadList(100, null, ["INBOX"]);

                for (const thread of threadList) {
                    const { threadID } = thread;
                    const threadInfo = await api.getThreadInfo(threadID);
                    const dataAntiChangeInfoBox = {
                        avatar: threadInfo.imageSrc || null,
                        name: threadInfo.threadName || null,
                        nickname: {},
                        theme: threadInfo.color || null,
                        emoji: threadInfo.emoji || null
                    };

                    if (threadInfo.nicknames) {
                        threadInfo.nicknames.forEach(({ participant_id, nickname }) => {
                            dataAntiChangeInfoBox.nickname[participant_id] = nickname;
                        });
                    }

                    await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
                }

                console.log("Thread properties saved successfully after bot restart.");
            } else {
                // Bot is starting for the first time
                console.log("Bot started for the first time. Initializing thread properties.");

                // Fetch initial thread properties and save them
                const threadList = await api.getThreadList(100, null, ["INBOX"]);

                for (const thread of threadList) {
                    const { threadID } = thread;
                    const threadInfo = await api.getThreadInfo(threadID);
                    const dataAntiChangeInfoBox = {
                        avatar: threadInfo.imageSrc || null,
                        name: threadInfo.threadName || null,
                        nickname: {},
                        theme: threadInfo.color || null,
                        emoji: threadInfo.emoji || null
                    };

                    if (threadInfo.nicknames) {
                        threadInfo.nicknames.forEach(({ participant_id, nickname }) => {
                            dataAntiChangeInfoBox.nickname[participant_id] = nickname;
                        });
                    }

                    await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
                }

                console.log("Thread properties initialized successfully.");
            }
        } catch (error) {
            console.error("Error handling bot start/restart and saving thread properties: ", error);
        }
    },

    onEvent: async function ({ api, event, threadsData, role }) {
        const { threadID, logMessageType, logMessageData, author } = event;
        const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});

        if (role < 1 && api.getCurrentUserID() !== author) {
            // Unauthorized change detected
            api.sendMessage("🛡️ | Unauthorized change detected. The bot will remove the user from the group.", threadID);
            api.removeUserFromGroup(author, threadID); // Kick the user out of the group
            return; // Exit function to prevent further processing of the unauthorized change
        }

        switch (logMessageType) {
            case "log:thread-image": {
                const originalAvatar = dataAntiChange.avatar;
                if (originalAvatar && role < 1 && api.getCurrentUserID() !== author) {
                    await api.changeGroupImage(await getStreamFromURL(originalAvatar), threadID);
                } else {
                    const newImageSrc = await uploadImgbb(logMessageData.url);
                    await threadsData.set(threadID, newImageSrc.image.url, "data.antiChangeInfoBox.avatar");
                }
                break;
            }
            case "log:thread-name": {
                const originalName = dataAntiChange.name;
                if (originalName && role < 1 && api.getCurrentUserID() !== author) {
                    await api.setTitle(originalName, threadID);
                } else {
                    await threadsData.set(threadID, logMessageData.name, "data.antiChangeInfoBox.name");
                }
                break;
            }
            case "log:user-nickname": {
                const { participant_id, nickname } = logMessageData;
                const originalNickname = dataAntiChange.nickname ? dataAntiChange.nickname[participant_id] : null;
                if (originalNickname && role < 1 && api.getCurrentUserID() !== author) {
                    await api.changeNickname(originalNickname, threadID, participant_id);
                } else {
                    await threadsData.set(threadID, nickname, `data.antiChangeInfoBox.nickname.${participant_id}`);
                }
                break;
            }
            case "log:thread-color": {
                const originalTheme = dataAntiChange.theme;
                if (originalTheme && role < 1 && api.getCurrentUserID() !== author) {
                    await api.changeThreadColor(originalTheme, threadID);
                } else {
                    await threadsData.set(threadID, logMessageData.theme_id, "data.antiChangeInfoBox.theme");
                }
                break;
            }
            case "log:thread-icon": {
                const originalEmoji = dataAntiChange.emoji;
                if (originalEmoji && role < 1 && api.getCurrentUserID() !== author) {
                    await api.changeThreadEmoji(originalEmoji, threadID);
                } else {
                    await threadsData.set(threadID, logMessageData.thread_icon, "data.antiChangeInfoBox.emoji");
                }
                break;
            }
        }
    }
};