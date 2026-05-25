'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

if (process.env.BOT_ADMIN_KEY) {
  fs.writeFileSync(path.join(root, 'key.txt'), process.env.BOT_ADMIN_KEY.trim(), 'utf8');
  console.log('[render] key.txt từ BOT_ADMIN_KEY');
} else if (!fs.existsSync(path.join(root, 'key.txt'))) {
  fs.writeFileSync(path.join(root, 'key.txt'), '2803', 'utf8');
  console.log('[render] key.txt mặc định admin');
}

const configPath = path.join(root, 'config.json');
const configExample = path.join(root, 'config.example.json');
if (!fs.existsSync(configPath) && fs.existsSync(configExample)) {
  fs.copyFileSync(configExample, configPath);
  console.log('[render] config.json từ config.example.json');
}

if (process.env.APPSTATE_JSON && !process.env.SKIP_APPSTATE_FILE) {
  try {
    const parsed = JSON.parse(process.env.APPSTATE_JSON);
    fs.writeFileSync(
      path.join(root, 'appstate.json'),
      JSON.stringify(parsed, null, 2),
      'utf8'
    );
    console.log('[render] appstate.json từ APPSTATE_JSON');
  } catch (e) {
    console.error('[render] APPSTATE_JSON không hợp lệ:', e.message);
    process.exit(1);
  }
}
