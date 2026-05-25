const adminGuard = require('../../utils/adminGuard');

module.exports.config = {
  name: 'help',
  version: '2.0.0',
  hasPermssion: 0,
  credits: 'Kurumi Bot',
  description: 'Xem danh sách lệnh và hướng dẫn chi tiết',
  commandCategory: 'Tiện ích',
  usages: '[tên lệnh | all]',
  cooldowns: 3,
  usePrefix: true,
};

function permText(p) {
  if (p === 3) return 'Người điều hành';
  if (p === 2) return 'Admin Bot';
  if (p === 1) return 'QTV nhóm';
  return 'Thành viên';
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID: tid, messageID: mid } = event;
  const cmds = global.client.commands;
  const prefix = (global.data.threadData.get(tid) || {}).PREFIX || global.config.PREFIX || '/';
  const botName = global.config.BOTNAME || 'Kurumi Bot';
  const adminLine = adminGuard.getAdminContactLine();
  const query = (args[0] || '').toLowerCase();

  if (query === 'all') {
    const lines = [];
    let n = 0;
    for (const cmd of cmds.values()) {
      n++;
      lines.push(`${n}. ${prefix}${cmd.config.name} — ${cmd.config.description || '—'}`);
    }
    return api.sendMessage(
      `📚 TẤT CẢ LỆNH (${n})\n${'─'.repeat(24)}\n${lines.join('\n')}\n\n${adminLine}`,
      tid,
      mid
    );
  }

  if (query) {
    const cmd = cmds.get(query) || Array.from(cmds.values()).find((c) => c.config.name.toLowerCase() === query);
    if (!cmd) {
      return api.sendMessage(`❌ Không có lệnh "${args[0]}".\n💡 ${prefix}menu hoặc ${prefix}help all`, tid, mid);
    }
    const c = cmd.config;
    const body =
      `📖 CHI TIẾT LỆNH: ${prefix}${c.name}\n${'─'.repeat(24)}\n` +
      `📝 Mô tả: ${c.description}\n` +
      `📂 Nhóm: ${c.commandCategory}\n` +
      `🔑 Quyền: ${permText(c.hasPermssion)}\n` +
      `⏳ Cooldown: ${c.cooldowns}s\n` +
      `📌 Cách dùng: ${prefix}${c.usages || c.name}\n` +
      `📦 Phiên bản: ${c.version}\n\n${adminLine}`;
    return api.sendMessage(body, tid, mid);
  }

  const byCat = {};
  for (const cmd of cmds.values()) {
    const cat = cmd.config.commandCategory || 'Khác';
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(cmd.config.name);
  }

  let body = `📚 ${botName} — TRỢ GIÚP\n${'─'.repeat(24)}\n`;
  body += `${prefix}help [tên] — chi tiết lệnh\n`;
  body += `${prefix}help all — toàn bộ lệnh\n`;
  body += `${prefix}menu — menu theo nhóm\n\n`;
  for (const [cat, names] of Object.entries(byCat)) {
    body += `▸ ${cat} (${names.length})\n  ${names.slice(0, 12).map((n) => prefix + n).join(', ')}${names.length > 12 ? '…' : ''}\n\n`;
  }
  body += `${adminLine}`;
  return api.sendMessage(body, tid, mid);
};
