const { getStreamFromURL, uploadImgbb } = global.utils;

module.exports = {
    config: {
        name: "antichangeinfobox",
        version: "1.0",
        author: "NTKhang",
        description: {
            en: "Automatically reverts thread properties (name, nickname, theme, emoji) on unauthorized changes.",
            vi: "Tự động khôi phục các thuộc tính của nhóm (tên, biệt danh, chủ đề, biểu tượng cảm xúc) khi phát hiện thay đổi trái phép."
        },
        category: "utility"
    },

    onStart: async function ({ api, event, threadsData }) {
        const { threadID } = event;

        // Function to check and save data to threadsData
        async function checkAndSaveData(key, data) {
            const dataAntiChangeInfoBox = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
            dataAntiChangeInfoBox[key] = data;
            await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
        }

        // Fetch current properties and save them
        const threadInfo = await api.getThreadInfo(threadID);

        if (threadInfo.imageSrc) {
            const newImageSrc = await uploadImgbb(threadInfo.imageSrc);
            await checkAndSaveData("avatar", newImageSrc.image.url);
        }

        if (threadInfo.threadName) {
            await checkAndSaveData("name", threadInfo.threadName);
        }

        if (threadInfo.nicknames) {
            // Save nicknames as an object where keys are participant IDs
            const nicknames = threadInfo.nicknames.reduce((obj, { participant_id, nickname }) => {
                obj[participant_id] = nickname;
                return obj;
            }, {});
            await checkAndSaveData("nickname", nicknames);
        }

        if (threadInfo.color) {
            await checkAndSaveData("theme", threadInfo.color);
        }

        if (threadInfo.emoji) {
            await checkAndSaveData("emoji", threadInfo.emoji);
        }
    },

    onEvent: async function ({ api, event, threadsData, role }) {
        const { threadID, logMessageType, logMessageData, author } = event;
        const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});

        // Helper function to handle unauthorized changes
        async function handleUnauthorizedChange(type, originalValue, revertFunction) {
            if (role < 1 && api.getCurrentUserID() !== author) {
                api.sendMessage("🛡️ | Unauthorized change detected. The bot will remove the user from the group.", threadID);
                api.removeUserFromGroup(author, threadID);
                if (originalValue) {
                    revertFunction(originalValue);
                }
            } else {
                return logMessageData[type];
            }
        }

        switch (logMessageType) {
            case "log:thread-image": {
                const originalAvatar = dataAntiChange.avatar;
                const newAvatar = await handleUnauthorizedChange("url", originalAvatar, async (url) => {
                    api.changeGroupImage(await getStreamFromURL(url), threadID);
                });
                if (newAvatar) {
                    const newImageSrc = await uploadImgbb(newAvatar);
                    await threadsData.set(threadID, newImageSrc.image.url, "data.antiChangeInfoBox.avatar");
                }
                break;
            }
            case "log:thread-name": {
                const originalName = dataAntiChange.name;
                const newName = await handleUnauthorizedChange("name", originalName, (name) => {
                    api.setTitle(name, threadID);
                });
                if (newName) {
                    await threadsData.set(threadID, newName, "data.antiChangeInfoBox.name");
                }
                break;
            }
            case "log:user-nickname": {
                const { participant_id, nickname } = logMessageData;
                const originalNickname = dataAntiChange.nickname ? dataAntiChange.nickname[participant_id] : null;
                const newNickname = await handleUnauthorizedChange("nickname", originalNickname, (nick) => {
                    api.changeNickname(nick, threadID, participant_id);
                });
                if (newNickname) {
                    await threadsData.set(threadID, newNickname, `data.antiChangeInfoBox.nickname.${participant_id}`);
                }
                break;
            }
            case "log:thread-color": {
                const originalTheme = dataAntiChange.theme;
                const newTheme = await handleUnauthorizedChange("theme_id", originalTheme, (theme) => {
                    api.changeThreadColor(theme, threadID);
                });
                if (newTheme) {
                    await threadsData.set(threadID, newTheme, "data.antiChangeInfoBox.theme");
                }
                break;
            }
            case "log:thread-icon": {
                const originalEmoji = dataAntiChange.emoji;
                const newEmoji = await handleUnauthorizedChange("thread_icon", originalEmoji, (emoji) => {
                    api.changeThreadEmoji(emoji, threadID);
                });
                if (newEmoji) {
                    await threadsData.set(threadID, newEmoji, "data.antiChangeInfoBox.emoji");
                }
                break;
            }
        }
    }
};