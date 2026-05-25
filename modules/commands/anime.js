const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const githubAnime = require('../../utils/githubAnime');
const adminGuard = require('../../utils/adminGuard');

const CACHE = path.join(__dirname, 'cache');

module.exports.config = {
  name: 'anime',
  version: '1.0.0',
  hasPermssion: 0,
  credits: 'Kurumi Bot',
  description: 'Random ảnh anime từ GitHub (bot-kurumi/data/anime.json)',
  commandCategory: 'Ảnh',
  usages: '[số lượng 1-5] | refresh',
  cooldowns: 5,
  usePrefix: true,
};

async function downloadImage(url, filePath) {
  const res = await axios.get(url, { responseType: 'stream', timeout: 60000 });
  await fs.ensureDir(path.dirname(filePath));
  await new Promise((resolve, reject) => {
    res.data.pipe(fs.createWriteStream(filePath)).on('finish', resolve).on('error', reject);
  });
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const sub = (args[0] || '').toLowerCase();

  if (sub === 'refresh' || sub === 'reload') {
    githubAnime.clearCache();
    const urls = await githubAnime.fetchFromGitHub(true);
    return api.sendMessage(
      `✅ Đã tải lại ${urls.length} ảnh từ GitHub.\n🔗 ${githubAnime.getConfigUrl()}`,
      threadID,
      messageID
    );
  }

  let count = parseInt(args[0], 10);
  if (isNaN(count) || count < 1) count = 1;
  if (count > 5) count = 5;

  const urls = await githubAnime.fetchFromGitHub();
  if (!urls.length) {
    return api.sendMessage(
      `❎ Chưa có danh sách ảnh.\nThêm file data/anime.json lên GitHub hoặc ${adminGuard.getAdminContactLine()}`,
      threadID,
      messageID
    );
  }

  const picked = githubAnime.pickRandom(urls, count);
  api.sendMessage(`⏳ Đang tải ${picked.length} ảnh anime…`, threadID);

  const attachments = [];
  const paths = [];
  try {
    for (let i = 0; i < picked.length; i++) {
      const ext = picked[i].includes('.png') ? 'png' : 'jpg';
      const fp = path.join(CACHE, `anime_${Date.now()}_${i}.${ext}`);
      await downloadImage(picked[i], fp);
      paths.push(fp);
      attachments.push(fs.createReadStream(fp));
    }
    await api.sendMessage(
      {
        body: `🖼️ Anime (${picked.length}) — nguồn GitHub Kurumi`,
        attachment: attachments,
      },
      threadID,
      () => paths.forEach((p) => { try { fs.unlinkSync(p); } catch (_) {} }),
      messageID
    );
  } catch (e) {
    paths.forEach((p) => { try { fs.unlinkSync(p); } catch (_) {} });
    api.sendMessage(`❎ Lỗi tải ảnh: ${e.message}`, threadID, messageID);
  }
};
