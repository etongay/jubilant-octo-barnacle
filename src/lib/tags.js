// Project tags: a stock set everyone gets, plus whatever the user invents.
// Custom tags live in settings rather than IndexedDB — they're a short list
// of strings, and keeping them out of the object stores means a tag survives
// even when the last project using it is deleted.

import { settings } from './db.js';

export const STOCK_TAGS = [
  'Blanket', 'Garment', 'Amigurumi', 'Gift',
  'Quick make', 'Stash buster', 'Baby', 'Home',
];

export function customTags() {
  const list = settings.get('customTags', []);
  return Array.isArray(list) ? list : [];
}

export function allTags() {
  return [...STOCK_TAGS, ...customTags()];
}

/** Returns the tag as stored, or null when it already exists or is empty. */
export function addCustomTag(name) {
  const clean = name.trim().slice(0, 24);
  if (!clean) return null;
  const exists = allTags().some(t => t.toLowerCase() === clean.toLowerCase());
  if (exists) return null;
  settings.set('customTags', [...customTags(), clean]);
  return clean;
}

export function removeCustomTag(name) {
  settings.set('customTags', customTags().filter(t => t !== name));
}
