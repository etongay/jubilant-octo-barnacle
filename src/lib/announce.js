// Screen-reader announcements through a single aria-live region.
// App.jsx registers the region's element on mount.

let region = null;

export function registerAnnouncer(el) {
  region = el;
}

export function announce(msg) {
  if (!region) return;
  region.textContent = '';
  requestAnimationFrame(() => {
    if (region) region.textContent = msg;
  });
}
