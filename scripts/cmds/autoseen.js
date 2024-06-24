const fs = require('fs-extra');
const pathFile = __dirname + '/tmp/autoseen.txt';

module.exports = {
  config: {
    name: 'autoseen',
    aliases: ['seen'],
    version: '1.0',
    author: 'Eugene Codm',
    countDown: 5,
    role: 0,
    shortDescription: 'Automatically mark all new messages as seen',
    longDescription: 'Automatically mark all new messages as seen',
    category: '..',
    guide: {
      en: ""
    }
  },

  onChat: async ({ api }) => {
    if (!fs.existsSync(pathFile)) {
      fs.writeFileSync(pathFile, 'true');
    }
    const isEnable = fs.readFileSync(pathFile, 'utf-8');
    if (isEnable === 'true') {
      api.markAsReadAll(() => {});
    }
  },

  onStart: async ({ api, event, args }) => {
    // This method is intentionally left empty
  }
};