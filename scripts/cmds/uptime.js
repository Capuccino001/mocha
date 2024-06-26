const os = require('os');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = {
  config: {
    name: "uptime",
    aliases: ["upt", "stat"],
    version: "1.0",
    author: "JARiF@Cock",
    role: 0,
    category: "owner",
    guide: {
      en: "Use {p}info"
    }
  },
  onStart: async function ({ message }) {

    try {
      const uptime = process.uptime();
      const formattedUptime = formatUptime(uptime);

      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      const diskUsage = await getDiskUsage();

      const systemInfo = {
        os: `${os.type()} ${os.release()}`,
        arch: os.arch(),
        cpu: `${os.cpus()[0].model} (${os.cpus().length} cores)`,
        loadAvg: os.loadavg()[0], // 1-minute load average
        botUptime: formattedUptime,
        systemUptime: formatUptime(os.uptime()),
        processMemory: prettyBytes(process.memoryUsage().rss)
      };

      const response = `★ 𝐒𝐲𝐬𝐭𝐞𝐦 𝐎𝐯𝐞𝐫𝐯𝐢𝐞𝐰 ★\n`
        + '-------------------------------------\n'
        + '⚙  𝐒𝐲𝐬𝐭𝐞𝐦 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧:\n'
        + `  𝐎𝐒: ${systemInfo.os}\n`
        + `  𝐀𝐫𝐜𝐡: ${systemInfo.arch}\n`
        + `  𝐂𝐏𝐔: ${systemInfo.cpu}\n`
        + `  𝐋𝐨𝐚𝐝 𝐀𝐯𝐠: ${systemInfo.loadAvg}%\n`
        + '-------------------------------------\n'
        + `💾 𝐌𝐞𝐦𝐨𝐫𝐲 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧:\n`
        + `  𝐌𝐞𝐦𝐨𝐫𝐲 𝐔𝐬𝐚𝐠𝐞: \n${prettyBytes(usedMemory)} / Total ${prettyBytes(totalMemory)}\n`
        + `  𝐑𝐀𝐌 𝐔𝐬𝐚𝐠𝐞: \n${prettyBytes(os.totalmem() - os.freemem())} / Total ${prettyBytes(totalMemory)}\n`
        + '-------------------------------------\n'
        + `💿 𝐃𝐢𝐬𝐤 𝐒𝐩𝐚𝐜𝐞 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧:\n`
        + `  𝐃𝐢𝐬𝐤 𝐒𝐩𝐚𝐜𝐞 𝐔𝐬𝐚𝐠𝐞: \n${prettyBytes(diskUsage.used)} / Total ${prettyBytes(diskUsage.total)}\n`
        + '-------------------------------------\n'
        + `🤖 𝐁𝐨𝐭 𝐔𝐩𝐭𝐢𝐦𝐞: \n${systemInfo.botUptime}\n`
        + `⚙ 𝐒𝐞𝐫𝐯𝐞𝐫 𝐔𝐩𝐭𝐢𝐦𝐞: \n${systemInfo.systemUptime}\n`
        + `📊 𝐏𝐫𝐨𝐜𝐞𝐬𝐬 𝐌𝐞𝐦𝐨𝐫𝐲 𝐔𝐬𝐚𝐠𝐞: \n${systemInfo.processMemory}\n`
        + '-------------------------------------';

      message.reply(response);
    } catch (error) {
      console.error("Error fetching system information: ", error);
      message.reply("Failed to retrieve system information.");
    }
  }
};

async function getDiskUsage() {
  try {
    const { stdout } = await exec('df -k /');
    const [_, total, used] = stdout.split('\n')[1].split(/\s+/).filter(Boolean);
    return { total: parseInt(total) * 1024, used: parseInt(used) * 1024 };
  } catch (error) {
    console.error("Error fetching disk usage: ", error);
    return { total: 0, used: 0 };
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function prettyBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}