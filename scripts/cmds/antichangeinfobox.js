const { getStreamFromURL, uploadImgbb } = global.utils;

module.exports = {
    config: {
        name: "antichangeinfobox",
        version: "1.9",
        author: "NTKhang",
        countDown: 5,
        role: 0,
        description: {
            en: "Turn on/off anti change info box"
        },
        category: "box chat",
        guide: {
            en: "   {pn} avt [on | off]: anti change avatar box chat"
                + "\n   {pn} name [on | off]: anti change name box chat"
                + "\n   {pn} nickname [on | off]: anti change nickname in box chat"
                + "\n   {pn} theme [on | off]: anti change theme box chat"
                + "\n   {pn} emoji [on | off]: anti change emoji box chat"
        }
    },

    langs: {
        en: {
            antiChangeAvatarOn: "Turn on anti change avatar box chat",
            missingAvt: "You have not set avatar for box chat",
            antiChangeNameOn: "Turn on anti change name box chat",
            antiChangeNicknameOn: "Turn on anti change nickname box chat",
            antiChangeThemeOn: "Turn on anti change theme box chat",
            antiChangeEmojiOn: "Turn on anti change emoji box chat",
            antiChangeAvatarAlreadyOn: "Your box chat is currently on anti change avatar",
            antiChangeAvatarAlreadyOnButMissingAvt: "Your box chat is currently on anti change avatar but your box chat has not set avatar",
            antiChangeNameAlreadyOn: "Your box chat is currently on anti change name",
            antiChangeNicknameAlreadyOn: "Your box chat is currently on anti change nickname",
            antiChangeThemeAlreadyOn: "Your box chat is currently on anti change theme",
            antiChangeEmojiAlreadyOn: "Your box chat is currently on anti change emoji"
        }
    },

    onStart: async function ({ message, event, args, threadsData, getLang, api }) {
        if (!["on", "off"].includes(args[1]))
            return message.SyntaxError();
        const { threadID } = event;
        const dataAntiChangeInfoBox = await threadsData.get(threadID, "data.antiChangeInfoBox", {});

        async function checkAndSaveData(key, data) {
            // Always save data as 'on'
            dataAntiChangeInfoBox[key] = data;

            await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
            message.reply(getLang(`antiChange${key.slice(0, 1).toUpperCase()}${key.slice(1)}On`));
        }

        switch (args[0]) {
            case "avt":
            case "avatar":
            case "image": {
                let currentAvatarUrl = await api.getThreadInfo(threadID).then(info => info.imageSrc);
                if (!currentAvatarUrl)
                    return message.reply(getLang("missingAvt"));
                const newImageSrc = await uploadImgbb(currentAvatarUrl);
                await checkAndSaveData("avatar", newImageSrc.image.url);
                break;
            }
            case "name": {
                const { threadName } = await threadsData.get(threadID);
                await checkAndSaveData("name", threadName);
                break;
            }
            case "nickname": {
                const { members } = await threadsData.get(threadID);
                await checkAndSaveData("nickname", members.map(user => ({ [user.userID]: user.nickname })).reduce((a, b) => ({ ...a, ...b }), {}));
                break;
            }
            case "theme": {
                const { threadThemeID } = await threadsData.get(threadID);
                await checkAndSaveData("theme", threadThemeID);
                break;
            }
            case "emoji": {
                const { emoji } = await threadsData.get(threadID);
                await checkAndSaveData("emoji", emoji);
                break;
            }
            default: {
                return message.SyntaxError();
            }
        }
    },

    onEvent: async function ({ message, event, threadsData, role, api, getLang }) {
        const { threadID, logMessageType, logMessageData, author } = event;
        switch (logMessageType) {
            case "log:thread-image": {
                const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
                if (!dataAntiChange.avatar && role < 1)
                    return;
                return async function () {
                    if (role < 1 && api.getCurrentUserID() !== author) {
                        if (dataAntiChange.avatar != "REMOVE") {
                            message.reply(getLang("antiChangeAvatarAlreadyOn"));
                            api.changeGroupImage(await getStreamFromURL(dataAntiChange.avatar), threadID);
                        } else {
                            message.reply(getLang("antiChangeAvatarAlreadyOnButMissingAvt"));
                        }
                    } else {
                        const imageSrc = logMessageData.url;
                        if (!imageSrc)
                            return await threadsData.set(threadID, "REMOVE", "data.antiChangeInfoBox.avatar");

                        const newImageSrc = await uploadImgbb(imageSrc);
                        await threadsData.set(threadID, newImageSrc.image.url, "data.antiChangeInfoBox.avatar");
                    }
                };
            }
            case "log:thread-name": {
                const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
                if (!dataAntiChange.hasOwnProperty("name"))
                    return;
                return async function () {
                    if (role < 1 && api.getCurrentUserID() !== author) {
                        message.reply(getLang("antiChangeNameAlreadyOn"));
                        api.setTitle(dataAntiChange.name, threadID);
                    } else {
                        const threadName = logMessageData.name;
                        await threadsData.set(threadID, threadName, "data.antiChangeInfoBox.name");
                    }
                };
            }
            case "log:user-nickname": {
                const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
                if (!dataAntiChange.hasOwnProperty("nickname"))
                    return;
                return async function () {
                    const { nickname, participant_id } = logMessageData;

                    if (role < 1 && api.getCurrentUserID() !== author) {
                        message.reply(getLang("antiChangeNicknameAlreadyOn"));
                        api.changeNickname(dataAntiChange.nickname[participant_id], threadID, participant_id);
                    } else {
                        await threadsData.set(threadID, nickname, `data.antiChangeInfoBox.nickname.${participant_id}`);
                    }
                };
            }
            case "log:thread-color": {
                const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
                if (!dataAntiChange.hasOwnProperty("theme"))
                    return;
                return async function () {
                    if (role < 1 && api.getCurrentUserID() !== author) {
                        message.reply(getLang("antiChangeThemeAlreadyOn"));
                        api.changeThreadColor(dataAntiChange.theme || "196241301102133", threadID); // 196241301102133 is default color
                    } else {
                        const threadThemeID = logMessageData.theme_id;
                        await threadsData.set(threadID, threadThemeID, "data.antiChangeInfoBox.theme");
                    }
                };
            }
            case "log:thread-icon": {
                const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
                if (!dataAntiChange.hasOwnProperty("emoji"))
                    return;
                return async function () {
                    if (role < 1 && api.getCurrentUserID() !== author) {
                        message.reply(getLang("antiChangeEmojiAlreadyOn"));
                        api.changeThreadEmoji(dataAntiChange.emoji, threadID);
                    } else {
                        const threadEmoji = logMessageData.thread_icon;
                        await threadsData.set(threadID, threadEmoji, "data.antiChangeInfoBox.emoji");
                    }
                };
            }
        }
    }
};