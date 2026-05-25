'use strict';

const FB_URLS = [
  'https://www.facebook.com',
  'https://facebook.com',
  'https://www.messenger.com',
];

function isEncryptedAppState(cookies) {
  return (
    Array.isArray(cookies) &&
    cookies.length > 0 &&
    typeof cookies[0] === 'string'
  );
}

function isPlainAppState(cookies) {
  return (
    Array.isArray(cookies) &&
    cookies.length > 0 &&
    typeof cookies[0] === 'object' &&
    cookies[0] != null &&
    cookies[0].key
  );
}

/**
 * Chuẩn hóa appstate export từ extension (c3c-fbstate, EditThisCookie, …)
 */
function normalizeAppState(cookies) {
  if (!Array.isArray(cookies)) return [];
  if (isEncryptedAppState(cookies)) return cookies;

  const defaultExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();

  return cookies
    .filter((c) => c && c.key && c.value != null && String(c.value).length > 0)
    .map((c) => {
      const rawDomain = (c.domain || 'facebook.com').replace(/^\./, '');
      const domain = rawDomain.startsWith('.') ? rawDomain : `.${rawDomain}`;
      const path = c.path || '/';
      return {
        key: c.key,
        value: String(c.value),
        domain,
        path,
        expires: c.expires || defaultExpires,
        secure: c.secure !== false,
        httpOnly: c.httpOnly === true,
        sameSite: c.sameSite || 'None',
      };
    });
}

function applyAppStateToJar(jar, cookies) {
  if (isEncryptedAppState(cookies)) return cookies;
  const normalized = normalizeAppState(cookies);
  for (const c of normalized) {
    const parts = [
      `${c.key}=${c.value}`,
      `domain=${c.domain}`,
      `path=${c.path}`,
    ];
    if (c.expires) parts.push(`expires=${c.expires}`);
    if (c.secure) parts.push('secure');
    const cookieStr = parts.join('; ') + ';';
    for (const url of FB_URLS) {
      try {
        jar.setCookie(cookieStr, url);
      } catch (_) {
        /* skip invalid cookie for url */
      }
    }
  }
  return normalized;
}

function hasSessionCookies(cookies) {
  if (!Array.isArray(cookies) || !cookies.length) return false;
  if (isEncryptedAppState(cookies)) return true;
  const keys = new Set(
    cookies.map((c) => c && c.key).filter(Boolean)
  );
  return keys.has('c_user') && keys.has('xs');
}

function prepareAppStateForLogin(raw) {
  if (isEncryptedAppState(raw)) return raw;
  if (isPlainAppState(raw)) return normalizeAppState(raw);
  return [];
}

module.exports = {
  normalizeAppState,
  applyAppStateToJar,
  hasSessionCookies,
  isEncryptedAppState,
  isPlainAppState,
  prepareAppStateForLogin,
  FB_URLS,
};
