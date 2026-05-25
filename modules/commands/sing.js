const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const { createWriteStream, unlinkSync, statSync } = require('fs-extra');
const adminGuard = require('../../utils/adminGuard');

const CACHE = path.join(__dirname, 'cache');
const MAX_BYTES = 25 * 1024 * 1024;

module.exports.config = {
  name: 'sing',
  version: '2.0.0',
  hasPermssion: 0,
  credits: 'Kurumi Bot',
  description: 'Tìm và tải nhạc từ YouTube (API youtube-search + stream)',
  commandCategory: 'Tìm kiếm',
  usages: '[tên bài / link YouTube]',
  cooldowns: 8,
  usePrefix: true,
};

function extractVideoId(url) {
  const m = String(url).match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

async function searchYoutube(query, limit = 6) {
  const { GetListByKeyword } = require('youtube-search-api');
  const res = await GetListByKeyword(query, false, limit);
  return (res && res.items) ? res.items.filter((i) => i && i.id) : [];
}

async function downloadAudioUrl(videoId) {
  const utils = require('../../utils');
  try {
    const meta = await utils.getYoutube(videoId, 'getLink', 'audio');
    if (meta && meta.download) return { title: meta.title, url: meta.download };
  } catch (_) { /* fallback */ }

  const ytdl = require('@distube/ytdl-core');
  const out = path.join(CACHE, `sing_${videoId}_${Date.now()}.mp4`);
  await fs.ensureDir(CACHE);
  await new Promise((resolve, reject) => {
    ytdl(videoId, { quality: 'lowestaudio', filter: 'audioonly' })
      .pipe(createWriteStream(out))
      .on('finish', resolve)
      .on('error', reject);
  });
  return { title: videoId, localPath: out };
}

async function sendAudio(api, threadID, messageID, payload) {
  if (payload.localPath) {
    const size = statSync(payload.localPath).size;
    if (size > MAX_BYTES) {
      unlinkSync(payload.localPath);
      return api.sendMessage('❎ File audio > 25MB, thử bài khác.', threadID, messageID);
    }
    await api.sendMessage(
      { body: `🎵 ${payload.title}`, attachment: fs.createReadStream(payload.localPath) },
      threadID,
      () => { try { unlinkSync(payload.localPath); } catch (_) {} },
      messageID
    );
    return;
  }
  const tmp = path.join(CACHE, `sing_dl_${Date.now()}.mp3`);
  await fs.ensureDir(CACHE);
  const res = await axios.get(payload.url, { responseType: 'stream', timeout: 120000 });
  await new Promise((resolve, reject) => {
    res.data.pipe(createWriteStream(tmp)).on('finish', resolve).on('error', reject);
  });
  if (statSync(tmp).size > MAX_BYTES) {
    unlinkSync(tmp);
    return api.sendMessage('❎ File audio > 25MB.', threadID, messageID);
  }
  await api.sendMessage(
    { body: `🎵 ${payload.title}`, attachment: fs.createReadStream(tmp) },
    threadID,
    () => { try { unlinkSync(tmp); } catch (_) {} },
    messageID
  );
}

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const choice = parseInt(event.body, 10);
  if (!choice || choice < 1 || choice > handleReply.items.length) {
    return api.sendMessage('❎ Reply số thứ tự từ 1 đến ' + handleReply.items.length, event.threadID, event.messageID);
  }
  const item = handleReply.items[choice - 1];
  const videoId = item.id;
  api.sendMessage(`⏳ Đang tải: ${item.title}\n🔗 https://youtu.be/${videoId}`, event.threadID);
  try {
    const payload = await downloadAudioUrl(videoId);
    payload.title = item.title || payload.title;
    await sendAudio(api, event.threadID, event.messageID, payload);
  } catch (e) {
    api.sendMessage(`❎ Lỗi tải nhạc: ${e.message}\n${adminGuard.getAdminContactLine()}`, event.threadID, event.messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(' ').trim();
  if (!query) {
    return api.sendMessage(
      `🎵 ${global.config.PREFIX}sing [tên bài]\n🎵 ${global.config.PREFIX}sing [link YouTube]`,
      threadID,
      messageID
    );
  }

  const directId = extractVideoId(query);
  if (directId) {
    try {
      const payload = await downloadAudioUrl(directId);
      await sendAudio(api, threadID, messageID, payload);
    } catch (e) {
      api.sendMessage(`❎ ${e.message}`, threadID, messageID);
    }
    return;
  }

  try {
    const items = await searchYoutube(query, 6);
    if (!items.length) {
      return api.sendMessage(`❎ Không tìm thấy "${query}"`, threadID, messageID);
    }
    let body = `🔎 Kết quả: ${query}\n${'─'.repeat(20)}\n`;
    items.forEach((it, i) => {
      body += `${i + 1}. ${it.title}\n   ⏱ ${it.length?.simpleText || '—'}\n`;
    });
    body += `\n📌 Reply STT (1-${items.length}) để tải audio`;
    return api.sendMessage(body, threadID, (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: event.senderID,
        items,
      });
    }, messageID);
  } catch (e) {
    return api.sendMessage(`❎ Lỗi tìm kiếm: ${e.message}`, threadID, messageID);
  }
};
