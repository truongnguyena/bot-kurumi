'use strict';

const { readdirSync } = require('fs-extra');
const { join } = require('path');

const SKIP_DIRS = new Set(['data', 'cache', 'src', 'node_modules', 'tt', 'lolx', 'FolderGame']);

/**
 * Thu thập đường dẫn lệnh .js (gốc + thư mục con, ví dụ niio/Game/…)
 * @param {string} commandsRoot - thư mục modules/commands
 * @returns {string[]} đường dẫn tương đối dùng '/' (vd: help.js, niio/Game/sing.js)
 */
function discoverCommandFiles(commandsRoot) {
  const out = [];

  function walk(dir, relBase) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(join(dir, entry.name), rel);
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.js') &&
        !entry.name.includes('example')
      ) {
        out.push(rel.replace(/\\/g, '/'));
      }
    }
  }

  walk(commandsRoot, '');
  return out;
}

module.exports = { discoverCommandFiles, SKIP_DIRS };
