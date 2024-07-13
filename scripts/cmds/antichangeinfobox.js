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

        async function checkAndSaveData(key, data) {
            const dataAntiChangeInfoBox = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
            dataAntiChangeInfoBox[key] = data;
            await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
        }

        const threadInfo = await api.getThreadInfo(threadID);

        try {
            if (threadInfo.imageSrc) {
                const newImageSrc = await uploadImgbb(threadInfo.imageSrc);
                await checkAndSaveData("avatar", newImageSrc.image.url);
            }

            if (threadInfo.threadName) {
                await checkAndSaveData("name", threadInfo.threadName);
            }

            if (threadInfo.nicknames) {
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
        } catch (error) {
            console.error("Error saving thread properties: ", error);
        }
    },

    onEvent: async function ({ api, event, threadsData, role }) {
        const { threadID, logMessageType, logMessageData, author } = event;
        const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});

        if (role < 1 && api.getCurrentUserID() !== author) {
            api.sendMessage("🛡️ | Unauthorized change detected. The bot will remove the user from the group.", threadID);
            api.removeUserFromGroup(author, threadID);
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