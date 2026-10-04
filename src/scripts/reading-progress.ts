// Reading progress stays on this device. Only the packaged app resumes automatically.
const STORAGE_KEY = 'threejs-tutorial:reading-progress:v1';
const MAX_RESTORE_MS = 2500;

type ReadingProgress = {
  path: string;
  scrollY: number;
  anchorId: string | null;
  anchorOffset: number;
  openDetails: number[];
};

function readProgress(): ReadingProgress | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!value || typeof value.path !== 'string' || !value.path.startsWith('/') ||
        value.path.startsWith('//') || !Number.isFinite(value.scrollY) || value.scrollY < 0 ||
        !(value.anchorId === null || typeof value.anchorId === 'string') ||
        !Number.isFinite(value.anchorOffset) || !Array.isArray(value.openDetails) ||
        !value.openDetails.every((index: unknown) => Number.isInteger(index) && Number(index) >= 0)) {
      return null;
    }
    return value;
  } catch {
    // Unavailable storage or an older/corrupt record must never block reading.
    return null;
  }
}

export function installReadingProgress() {
  if (document.querySelector<HTMLMetaElement>('meta[name="tutorial-build-target"]')?.content !== 'app') return;
  const start = () => {
    const page = document.querySelector<HTMLMetaElement>('meta[name="tutorial-reading-page"]')?.content;
    const previous = readProgress();

    if (page === 'home') {
      // A normal navigation to Home should remain there. Native cold launches
      // have no same-origin referrer; a reload of Home is also an explicit action.
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const fromThisApp = document.referrer && new URL(document.referrer).origin === location.origin;
      if (previous && !location.hash && !fromThisApp && navigation?.type !== 'reload' && navigation?.type !== 'back_forward') {
        // The splash homepage hides its sidebar. Head supplies the actual built
        // sidebar routes so removed chapters cannot cause a missing-page loop.
        const routes: string[] = JSON.parse(document.querySelector<HTMLMetaElement>('meta[name="tutorial-reading-routes"]')?.content ?? '[]');
        const destination = routes.map((path) => new URL(path, location.href)).find((url) =>
          url.origin === location.origin && url.pathname === previous.path && !url.hash && !url.search,
        );
        if (destination) location.replace(destination.href);
      }
      return;
    }
    if (page !== 'chapter') return;

    const details = () => Array.from(document.querySelectorAll<HTMLDetailsElement>('main details'));
    let restoring = previous?.path === location.pathname && !location.hash;
    let restoreFrame = 0;
    let saveTimer = 0;
    let resizeObserver: ResizeObserver | undefined;

    function save() {
      clearTimeout(saveTimer);
      saveTimer = 0;
      if (restoring) return;
      const headings = Array.from(document.querySelectorAll<HTMLElement>('main h1[id], main h2[id], main h3[id], main h4[id]'));
      const anchor = headings.filter((heading) => heading.getBoundingClientRect().top <= 100).at(-1);
      const progress: ReadingProgress = {
        path: location.pathname,
        scrollY: Math.max(0, window.scrollY),
        anchorId: anchor?.id ?? null,
        anchorOffset: anchor ? -anchor.getBoundingClientRect().top : 0,
        openDetails: details().flatMap((element, index) => element.open ? [index] : []),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* Reading still works. */ }
    }
    function scheduleSave() {
      if (!restoring && !saveTimer) saveTimer = window.setTimeout(save, 150);
    }
    function stopRestoring() {
      if (!restoring) return;
      restoring = false;
      cancelAnimationFrame(restoreFrame);
      resizeObserver?.disconnect();
      save();
    }
    function restore() {
      if (!restoring || !previous) return;
      const anchor = previous.anchorId ? document.getElementById(previous.anchorId) : null;
      const top = anchor ? window.scrollY + anchor.getBoundingClientRect().top + previous.anchorOffset : previous.scrollY;
      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    }

    window.addEventListener('scroll', scheduleSave, { passive: true });
    // User input wins over delayed fonts/images restoring their layout.
    for (const event of ['pointerdown', 'touchstart', 'wheel', 'keydown']) {
      window.addEventListener(event, stopRestoring, { passive: true, once: true });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { stopRestoring(); save(); }
    });
    window.addEventListener('pagehide', () => { stopRestoring(); save(); });
    // BFCache owns its scroll position; save it without applying a second restore.
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) { stopRestoring(); save(); }
    });
    document.querySelector('main')?.addEventListener('toggle', scheduleSave, true);

    if (restoring && previous) {
      details().forEach((element, index) => { element.open = previous.openDetails.includes(index); });
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(() => {
          cancelAnimationFrame(restoreFrame);
          restoreFrame = requestAnimationFrame(restore);
        });
        resizeObserver.observe(document.documentElement);
      }
      restoreFrame = requestAnimationFrame(restore);
      document.fonts?.ready.then(restore);
      window.addEventListener('load', restore, { once: true });
      // Limit retries, and never keep fighting the reader's own scrolling.
      window.setTimeout(stopRestoring, MAX_RESTORE_MS);
    } else {
      save();
      // Browser anchor scrolling can happen after DOMContentLoaded.
      window.addEventListener('load', scheduleSave, { once: true });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
