'use strict';

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const DEFAULT_RAW =
  'https://raw.githubusercontent.com/truongnguyena/bot-kurumi/main/data/anime.json';

let cache = { urls: [], fetchedAt: 0 };
const TTL_MS = 10 * 60 * 1000;

function getConfigUrl() {
  const cfg = (typeof global !== 'undefined' && global.config) ? global.config : {};
  return (cfg.GITHUB_ANIME_URL || process.env.GITHUB_ANIME_URL || DEFAULT_RAW).trim();
}

function localFallbackPath() {
  const root = process.cwd();
  const candidates = [
    path.join(root, 'data', 'anime.json'),
    path.join(root, 'includes', 'listapi', 'ảnh', 'anime1.json'),
    path.join(root, 'includes', 'listapi', 'ảnh', 'anime2.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseList(data) {
  if (Array.isArray(data)) return data.filter((u) => typeof u === 'string' && u.startsWith('http'));
  if (data && Array.isArray(data.images)) return data.images;
  return [];
}

async function fetchFromGitHub(force = false) {
  const now = Date.now();
  if (!force && cache.urls.length && now - cache.fetchedAt < TTL_MS) {
    return cache.urls;
  }

  const url = getConfigUrl();
  try {
    const res = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'KurumiBot/1.0' },
    });
    const urls = parseList(res.data);
    if (urls.length) {
      cache = { urls, fetchedAt: now };
      return urls;
    }
  } catch (_) { /* fallback local */ }

  const local = localFallbackPath();
  if (local) {
    const urls = parseList(JSON.parse(fs.readFileSync(local, 'utf8')));
    cache = { urls, fetchedAt: now };
    return urls;
  }

  return [];
}

function pickRandom(urls, count = 1) {
  const n = Math.min(Math.max(1, count), 10, urls.length);
  const pool = [...urls];
  const picked = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

module.exports = {
  getConfigUrl,
  fetchFromGitHub,
  pickRandom,
  clearCache: () => { cache = { urls: [], fetchedAt: 0 }; },
};
