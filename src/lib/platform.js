// Platform-adaptive design: the app wears an iOS 26 "liquid glass" skin
// on iPhones/iPads, a Material 3 skin on Android, and the cozy classic
// look everywhere else. Detection follows the device; Settings can pin
// any skin ('auto' | 'cozy' | 'ios' | 'material').

import { settings } from './db.js';

export function detectPlatform() {
  const ua = navigator.userAgent;
  // Modern iPads report as Mac; the touch check catches them.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'material';
  return 'cozy';
}

export function applyPlatform(pref) {
  settings.set('platform', pref);
  const resolved = pref === 'auto' || !pref ? detectPlatform() : pref;
  if (resolved === 'cozy') document.documentElement.removeAttribute('data-platform');
  else document.documentElement.setAttribute('data-platform', resolved);
  return resolved;
}
