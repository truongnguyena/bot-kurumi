'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const root = path.join(__dirname, '..');
const tag = process.env.FLY_APP_NAME ? '[fly]' : process.env.RENDER ? '[render]' : '[deploy]';
const DEFAULT_APPSTATE_URL =
  'https://raw.githubusercontent.com/truongnguyena/bot-kurumi/main/data/appstate.json';

function log(msg) {
  console.log(`${tag} ${msg}`);
}

function writeAppstate(parsed) {
  fs.writeFileSync(path.join(root, 'appstate.json'), JSON.stringify(parsed, null, 2), 'utf8');
}

function fetchJsonUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib
      .get(url, { headers: { 'User-Agent': 'KurumiBot/1.0' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return fetchJsonUrl(res.headers.location).then(resolve).catch(reject);
        }
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

if (process.env.BOT_ADMIN_KEY) {
  fs.writeFileSync(path.join(root, 'key.txt'), process.env.BOT_ADMIN_KEY.trim(), 'utf8');
  log('key.txt từ BOT_ADMIN_KEY');
} else if (!fs.existsSync(path.join(root, 'key.txt'))) {
  fs.writeFileSync(path.join(root, 'key.txt'), '2803', 'utf8');
  log('key.txt mặc định admin');
}

const configPath = path.join(root, 'config.json');
const configExample = path.join(root, 'config.example.json');
if (!fs.existsSync(configPath) && fs.existsSync(configExample)) {
  fs.copyFileSync(configExample, configPath);
  log('config.json từ config.example.json');
}

const rootAppstate = path.join(root, 'appstate.json');
const bundledAppstate = path.join(root, 'data', 'appstate.json');

async function ensureAppstate() {
  if (process.env.SKIP_APPSTATE_FILE) return;

  if (process.env.APPSTATE_B64) {
    try {
      const json = Buffer.from(process.env.APPSTATE_B64, 'base64').toString('utf8');
      writeAppstate(JSON.parse(json));
      log('appstate.json từ APPSTATE_B64');
      return;
    } catch (e) {
      console.error(`${tag} APPSTATE_B64 không hợp lệ:`, e.message);
      process.exit(1);
    }
  }

  if (process.env.APPSTATE_JSON) {
    try {
      writeAppstate(JSON.parse(process.env.APPSTATE_JSON));
      log('appstate.json từ APPSTATE_JSON');
      return;
    } catch (e) {
      console.error(`${tag} APPSTATE_JSON không hợp lệ:`, e.message);
      process.exit(1);
    }
  }

  if (fs.existsSync(rootAppstate)) {
    log('appstate.json đã có sẵn');
    return;
  }

  if (fs.existsSync(bundledAppstate)) {
    fs.copyFileSync(bundledAppstate, rootAppstate);
    log('appstate.json từ data/appstate.json (GitHub / Docker image)');
    return;
  }

  const url =
    process.env.GITHUB_APPSTATE_URL ||
    (fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath, 'utf8')).GITHUB_APPSTATE_URL
      : null) ||
    DEFAULT_APPSTATE_URL;

  try {
    const parsed = await fetchJsonUrl(url);
    if (!Array.isArray(parsed) || !parsed.length) {
      throw new Error('JSON phải là mảng cookie');
    }
    writeAppstate(parsed);
    log(`appstate.json tải từ GitHub: ${url}`);
    return;
  } catch (e) {
    console.error(`${tag} Không tải được appstate từ GitHub:`, e.message);
  }

  if (process.env.FLY_APP_NAME || process.env.RENDER || process.env.FLY_ALLOC_ID) {
    console.error(`${tag} Thiếu appstate — thêm data/appstate.json lên GitHub rồi fly deploy`);
    process.exit(1);
  }
}

ensureAppstate().catch((e) => {
  console.error(e);
  process.exit(1);
});
