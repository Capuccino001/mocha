const { getStreamFromURL, uploadImgbb } = global.utils;

module.exports = {
    config: {
        name: "antichangeinfobox",
        version: "2.2",
        author: "NTKhang",
        countDown: 5,
        role: 0,
        description: "Always on anti-change settings for chat box properties",
        category: "box chat",
        guide: "No guide needed as all anti-change settings are always on"
    },

    langs: {
        en: {
            antiChangeAvatarOn: "Anti change avatar is always on",
            missingAvt: "You have not set avatar for box chat",
            antiChangeNameOn: "Anti change name is always on",
            antiChangeNicknameOn: "Anti change nickname is always on",
            antiChangeThemeOn: "Anti change theme is always on",
            antiChangeEmojiOn: "Anti change emoji is always on",
            antiChangeAvatarAlreadyOn: "Anti change avatar is currently enabled",
            antiChangeAvatarAlreadyOnButMissingAvt: "Anti change avatar is enabled but avatar is not set",
            antiChangeNameAlreadyOn: "Anti change name is currently enabled",
            antiChangeNicknameAlreadyOn: "Anti change nickname is currently enabled",
            antiChangeThemeAlreadyOn: "Anti change theme is currently enabled",
            antiChangeEmojiAlreadyOn: "Anti change emoji is currently enabled"
        }
    },

    onStart: async function ({ event, threadsData }) {
        const { threadID } = event;
        const dataAntiChangeInfoBox = await threadsData.get(threadID, "data.antiChangeInfoBox", {});

        const threadData = await threadsData.get(threadID);
        const imageSrc = threadData.imageSrc;

        if (imageSrc) {
            const newImageSrc = await uploadImgbb(imageSrc);
            dataAntiChangeInfoBox.avatar = newImageSrc.image.url;
        } else {
            dataAntiChangeInfoBox.avatar = "REMOVE";
        }

        dataAntiChangeInfoBox.name = threadData.threadName;
        dataAntiChangeInfoBox.nickname = threadData.members.reduce((acc, user) => {
            acc[user.userID] = user.nickname;
            return acc;
        }, {});
        dataAntiChangeInfoBox.theme = threadData.threadThemeID;
        dataAntiChangeInfoBox.emoji = threadData.emoji;

        await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
    },

    onEvent: async function ({ message, event, threadsData, role, api, getLang }) {
        const { threadID, logMessageType, logMessageData, author } = event;
        const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
        const currentUserID = api.getCurrentUserID();

        async function handleAvatarChange() {
            if (role < 1 && currentUserID !== author) {
                message.reply(getLang("antiChangeAvatarAlreadyOn"));
                if (dataAntiChange.avatar !== "REMOVE") {
                    api.changeGroupImage(await getStreamFromURL(dataAntiChange.avatar), threadID);
                } else {
                    message.reply(getLang("antiChangeAvatarAlreadyOnButMissingAvt"));
                }
            } else if (role >= 1 || currentUserID === author) {
                const imageSrc = logMessageData.url;
                if (!imageSrc) {
                    return await threadsData.set(threadID, "REMOVE", "data.antiChangeInfoBox.avatar");
                }

                const newImageSrc = await uploadImgbb(imageSrc);
                await threadsData.set(threadID, newImageSrc.image.url, "data.antiChangeInfoBox.avatar");
            }
        }

        async function handleNameChange() {
            if (role < 1 && currentUserID !== author) {
                message.reply(getLang("antiChangeNameAlreadyOn"));
                api.setTitle(dataAntiChange.name, threadID);
            } else {
                await threadsData.set(threadID, logMessageData.name, "data.antiChangeInfoBox.name");
            }
        }

        async function handleNicknameChange() {
            const { participant_id } = logMessageData;

            // Check if the nickname change is for the bot
            if (currentUserID === participant_id) {
                if (role < 1 && currentUserID !== author) {
                    message.reply(getLang("antiChangeNicknameAlreadyOn"));
                    api.changeNickname(dataAntiChange.nickname[participant_id], threadID, participant_id);
                } else {
                    await threadsData.set(threadID, logMessageData.nickname, `data.antiChangeInfoBox.nickname.${participant_id}`);
                }
            } else {
                await threadsData.set(threadID, logMessageData.nickname, `data.antiChangeInfoBox.nickname.${participant_id}`);
            }
        }

        async function handleThemeChange() {
            if (role < 1 && currentUserID !== author) {
                message.reply(getLang("antiChangeThemeAlreadyOn"));
                api.changeThreadColor(dataAntiChange.theme || "196241301102133", threadID);
            } else {
                await threadsData.set(threadID, logMessageData.theme_id, "data.antiChangeInfoBox.theme");
            }
        }

        async function handleEmojiChange() {
            if (role < 1 && currentUserID !== author) {
                message.reply(getLang("antiChangeEmojiAlreadyOn"));
                api.changeThreadEmoji(dataAntiChange.emoji, threadID);
            } else {
                await threadsData.set(threadID, logMessageData.thread_icon, "data.antiChangeInfoBox.emoji");
            }
        }

        switch (logMessageType) {
            case "log:thread-image":
                return handleAvatarChange();
            case "log:thread-name":
                return handleNameChange();
            case "log:user-nickname":
                return handleNicknameChange();
            case "log:thread-color":
                return handleThemeChange();
            case "log:thread-icon":
                return handleEmojiChange();
        }
    }
};