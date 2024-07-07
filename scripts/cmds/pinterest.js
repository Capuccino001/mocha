const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const services = [
  { url: 'https://samirxpikachu.onrender.com/pinterest', param: 'query' },
  { url: 'https://celestial-dainsleif-v2.onrender.com/pinterest', param: 'pinte' },
  { url: 'https://itsaryan.onrender.com/api/pinterest', param: 'query' },
  { url: async () => ({ url: `${await baseApiUrl()}/pinterest`, param: 'search' }) },
  { url: 'https://api.kenliejugarap.com/pinterestbymarjhun/?search=', param: 'search' },
  { url: 'https://openapi-idk8.onrender.com/pinterest', param: 'search' },
  { url: 'https://jonellccprojectapis10.adaptable.app/api/pin?title=wallpaper&count=10', param: 'title' },
  { url: 'http://markdevs-last-api.onrender.com/api/pinterest?search=&amount=', param: 'search' }
];

const baseApiUrl = async () => {
  const { data } = await axios.get('https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json');
  return data.api;
};

const fetchImages = async (url, params, fetchedImageUrls) => {
  try {
    const { data } = await axios.get(url, { params });
    if (!Array.isArray(data) || data.length === 0) return [];

    return await Promise.all(data.slice(0, params.limit).map(async (item, i) => {
      const imageUrl = item.image || item;
      if (fetchedImageUrls.includes(imageUrl)) return null;

      fetchedImageUrls.push(imageUrl);
      try {
        const { data: imgBuffer } = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imgPath = path.join(__dirname, 'tmp', `${i + 1}.jpg`);
        await fs.outputFile(imgPath, imgBuffer);
        return fs.createReadStream(imgPath);
      } catch {
        return null;
      }
    }));
  } catch {
    return [];
  }
};

const getApiParams = (service, keySearch, numberSearch) => ({ [service.param]: keySearch, limit: numberSearch });

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["pin"],
    version: "1.0",
    author: "Coffee",
    role: 0,
    countDown: 60,
    shortDescription: { en: "Search for images on Pinterest" },
    category: "image",
    guide: { en: "{prefix}pinterest cat -5" }
  },

  onStart: async function ({ api, event, args }) {
    const tmpDir = path.join(__dirname, 'tmp');
    await fs.ensureDir(tmpDir);

    try {
      const keySearch = args.join(" ").trim();
      if (!keySearch) return api.sendMessage("📷 | Please follow this format:\n-pinterest cat -5", event.threadID, event.messageID);

      const keySearchs = keySearch.split('-')[0].trim();
      let numberSearch = parseInt(keySearch.split("-").pop().trim());
      numberSearch = isNaN(numberSearch) ? 3 : Math.min(Math.max(numberSearch, 1), 15);

      let fetchedImageUrls = [];
      const apiPromises = services.map(async (service) => {
        const { url, param } = typeof service === 'function' ? await service() : service;
        const params = getApiParams({ url, param }, keySearchs, numberSearch);
        return fetchImages(url, params, fetchedImageUrls);
      });

      const results = await Promise.allSettled(apiPromises);
      const successfulResults = results.flatMap(result => result.status === 'fulfilled' ? result.value : []).filter(img => img !== null);

      if (successfulResults.length === 0) throw new Error("No images found.");

      await api.sendMessage({
        attachment: successfulResults,
        body: `Here are the top ${successfulResults.length} image results for "${keySearchs}":`
      }, event.threadID, event.messageID);
    } catch (error) {
      const errorMessage = error.message === "No images found."
        ? "(⁠ ⁠･ั⁠﹏⁠･ั⁠) can't fetch images, api dead."
        : `📷 | ${error.message}`;
      await api.sendMessage(errorMessage, event.threadID, event.messageID);
    } finally {
      await fs.remove(tmpDir);
    }
  }
};

