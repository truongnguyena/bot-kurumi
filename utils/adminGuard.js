'use strict';

const fs = require('fs');
const path = require('path');

const KURUMI_ID = '100041651315453';
const KURUMI_FB = 'https://www.facebook.com/kurumi2004/';

function getAdminIds() {
  const cfg = (typeof global !== 'undefined' && global.config) ? global.config : {};
  const ids = new Set([KURUMI_ID]);
  for (const list of [cfg.ADMINBOT, cfg.NDH, cfg.IMMUNE_IDS]) {
    if (!Array.isArray(list)) continue;
    for (const id of list) {
      const s = String(id || '').trim();
      if (s) ids.add(s);
    }
  }
  return ids;
}

function isBotAdmin(userId) {
  if (userId == null || userId === '') return false;
  return getAdminIds().has(String(userId));
}

/** Miễn ban/kick/cấm lệnh toàn cục */
function isImmune(userId) {
  return isBotAdmin(userId);
}

function getAdminContactLine() {
  const cfg = (typeof global !== 'undefined' && global.config) ? global.config : {};
  const name = cfg.ADMIN_NAME || 'Kurumi';
  const fb = cfg.FACEBOOK_ADMIN || KURUMI_FB;
  return `📌 Admin: ${name} — ${fb}`;
}

function clearAdminSanctions() {
  if (typeof global === 'undefined' || !global.data) return;
  const ids = getAdminIds();
  for (const id of ids) {
    global.data.userBanned?.delete(id);
    global.data.commandBanned?.delete(id);
    if (global.client?.superBan) global.client.superBan.delete(id);
  }
  const banPath = path.join(process.cwd(), 'modules/commands/data/autokick_banlist.json');
  if (fs.existsSync(banPath)) {
    try {
      const banList = JSON.parse(fs.readFileSync(banPath, 'utf8'));
      let changed = false;
      for (const threadID of Object.keys(banList)) {
        const before = banList[threadID]?.length || 0;
        banList[threadID] = (banList[threadID] || []).filter((uid) => !ids.has(String(uid)));
        if (banList[threadID].length !== before) changed = true;
      }
      if (changed) fs.writeFileSync(banPath, JSON.stringify(banList, null, 2), 'utf8');
    } catch (_) { /* ignore */ }
  }
  const cmdBanPath = path.join(process.cwd(), 'modules/commands/data/commands-banned.json');
  if (fs.existsSync(cmdBanPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(cmdBanPath, 'utf8'));
      let changed = false;
      for (const threadID of Object.keys(data)) {
        const users = data[threadID]?.users || {};
        for (const uid of ids) {
          if (users[uid]) {
            delete users[uid];
            changed = true;
          }
        }
      }
      if (changed) fs.writeFileSync(cmdBanPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (_) { /* ignore */ }
  }
}

module.exports = {
  KURUMI_ID,
  KURUMI_FB,
  getAdminIds,
  isBotAdmin,
  isImmune,
  getAdminContactLine,
  clearAdminSanctions,
};
