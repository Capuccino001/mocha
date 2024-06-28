const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// List of API URLs
const services = [
  'https://samirxpikachu.onrender.com/pinterest',
  'https://celestial-dainsleif-v2.onrender.com/pinterest',
  'https://itsaryan.onrender.com/api/pinterest',
  async () => {
    const baseApi = await baseApiUrl();
    return `${baseApi}/pinterest`;
  },
  'https://api.kenliejugarap.com/pinterestbymarjhun/?search=',
  'https://openapi-idk8.onrender.com/pinterest',
  'https://jonellccprojectapis10.adaptable.app/api/pin?title=wallpaper&count=10',
  'http://markdevs-last-api.onrender.com/api/pinterest?search=&amount=' // New API added
];

// Function to get base API URL for the fourth API
const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`
  );
  return base.data.api;
};

// Function to fetch images from an API
const fetchImages = async (url, params, fetchedImageUrls) => {
  try {
    const { data } = await axios.get(url, { params });

    if (Array.isArray(data) && data.length > 0) {
      return await Promise.all(data.slice(0, params.number || params.limit || 1).map(async (item, i) => {
        const imageUrl = item.image || item;
        if (!fetchedImageUrls.includes(imageUrl)) {
          fetchedImageUrls.push(imageUrl);
          try {
            const { data: imgBuffer } = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imgPath = path.join(__dirname, 'tmp', `${i + 1}.jpg`);
            await fs.outputFile(imgPath, imgBuffer);
            return fs.createReadStream(imgPath);
          } catch (error) {
            console.error(`Error downloading image from ${imageUrl}:`, error);
            return null;
          }
        } else {
          return null;
        }
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error(`Error fetching images from ${url}:`, error);
    return [];
  }
};

// Function to get API parameters based on the URL
const getApiParams = (url, keySearch, numberSearch) => {
  if (url.includes('samirxpikachu')) {
    return { query: keySearch, number: numberSearch, apikey: 'global' };
  } else if (url.includes('celestial-dainsleif-v2')) {
    return { pinte: keySearch, limit: numberSearch };
  } else if (url.includes('itsaryan')) {
    return { query: keySearch, limits: numberSearch };
  } else if (url.includes('api.kenliejugarap.com/pinterestbymarjhun')) {
    return { search: encodeURIComponent(keySearch), limit: numberSearch };
  } else if (url.includes('openapi-idk8')) {
    return { search: keySearch, count: numberSearch };
  } else if (url.includes('jonellccprojectapis10')) {
    return { title: keySearch, count: numberSearch };
  } else if (url.includes('markdevs-last-api')) {
    return { search: keySearch, amount: numberSearch };
  } else {
    return { search: keySearch, limit: numberSearch };
  }
};

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["pin"],
    version: "1.0",
    author: "Combined Script",
    role: 0,
    countDown: 60,
    shortDescription: {
      en: "Search for images on Pinterest"
    },
    category: "image",
    guide: {
      en: "{prefix}pinterest cat -5"
    }
  },

  onStart: async function ({ api, event, args }) {
    const tmpDir = path.join(__dirname, 'tmp');
    await fs.ensureDir(tmpDir);

    try {
      const keySearch = args.join(" ");
      const keySearchs = keySearch.substr(0, keySearch.indexOf('-')).trim();
      if (!keySearchs) {
        throw new Error("Please follow this format:\n-pinterest cat -4");
      }
      let numberSearch = parseInt(keySearch.split("-").pop().trim()) || 1;
      numberSearch = Math.min(Math.max(numberSearch, 1), 15); // Ensure the range is between 1 and 15

      let imgData = [];
      let fetchedImageUrls = [];

      // Iterate through API services to fetch images sequentially
      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        try {
          const url = typeof service === 'function' ? await service() : service;
          const params = getApiParams(url, keySearchs, numberSearch);
          imgData = await fetchImages(url, params, fetchedImageUrls);
          if (imgData.length > 0) {
            break; // Exit loop if images are fetched successfully
          }
        } catch (error) {
          console.error(`Error fetching images from API ${i + 1}:`, error);
        }
      }

      if (!imgData || imgData.length === 0) {
        throw new Error("No images found.");
      }

      await api.sendMessage({
        attachment: imgData.filter(img => img !== null),
        body: `Here are the top ${imgData.length} image results for "${keySearchs}":`
      }, event.threadID, event.messageID);

    } catch (error) {
      console.error("Error in Pinterest bot:", error);
      if (error.message === "No images found.") {
        return api.sendMessage("(⁠ ⁠･ั⁠﹏⁠･ั⁠) can't fetch images, api dead.", event.threadID, event.messageID);
      } else {
        return api.sendMessage(`📷 | ${error.message}`, event.threadID, event.messageID);
      }
    } finally {
      // Clean up the temporary files
      await fs.remove(tmpDir);
    }
  }
};