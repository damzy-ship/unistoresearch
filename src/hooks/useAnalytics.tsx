import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import recordUserAction from '../lib/analyticsService';

const GLOBAL_KEY = '__unistore_analytics_last_sent__';

function getGlobalMap(): Map<string, number> {
  if (typeof window === 'undefined') return new Map<string, number>();
  const win = window as unknown as Record<string, unknown>;
  let map = win[GLOBAL_KEY] as Map<string, number> | undefined;
  if (!map) {
    map = new Map<string, number>();
    // assign back to window for reuse across instances
    (win as Record<string, unknown>)[GLOBAL_KEY] = map;
  }
  return map;
}

function shouldSendGlobal(key: string, windowMs = 1500) {
  if (typeof window === 'undefined') return true;
  const now = Date.now();
  const map = getGlobalMap();
  const lastTs = map.get(key) ?? 0;
  if (now - lastTs > windowMs) {
    map.set(key, now);
    return true;
  }
  return false;
}

/**
 * Hook that automatically records page views, navigation and UI clicks.
 * - records a `page_view` on mount and when location changes
 * - listens for document click events and records `ui_click` when a button
 *   or any element with a `data-analytics` attribute is clicked
 */
export default function useAnalytics() {
  const location = useLocation();
  const prevPathRef = useRef<string>(location.pathname + location.search);

  // dedupe performed by module-scoped shouldSendGlobal/getGlobalMap

  useEffect(() => {
    // Record a navigation event (from -> to) and a page_view whenever the location changes
    const from = prevPathRef.current;
    const to = location.pathname + location.search;

    if (from !== to) {
      const navKey = `navigation:${from}->${to}`;
      if (shouldSendGlobal(navKey, 2000)) {
        void recordUserAction({
          eventType: 'navigation',
          eventDetails: { from, to, pathname: location.pathname, search: location.search },
          eventDescription: 'Navigation'
        });
      }
    }

    const pvKey = `page_view:${to}`;
    if (shouldSendGlobal(pvKey, 2000)) {
      void recordUserAction({
        eventType: 'page_view',
        eventDetails: { pathname: location.pathname, search: location.search },
        eventDescription: 'Page view'
      });
    }

    prevPathRef.current = to;
  }, [location.pathname, location.search]);

  useEffect(() => {
    // Attach the click handler once; use window.location to get page at click time
    const clickHandler = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        const el = target.closest('button, a, input[type="button"], input[type="submit"], [role="button"], [data-analytics], [data-analytics-id]') as HTMLElement | null;
        if (!el) return;

        const analyticsId = el.dataset.analyticsId ?? el.dataset.analytics ?? null;
        const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || (el.getAttribute('href') ?? '') || '').trim();
        const page = typeof window !== 'undefined' ? window.location.pathname : '';
        const info: Record<string, unknown> = {
          tag: el.tagName,
          analytics_id: analyticsId,
          text: text.slice(0, 200),
          classes: el.className,
          page
        };

        if (el.tagName.toLowerCase() === 'a') {
          (info as Record<string, unknown>)['href'] = (el as HTMLAnchorElement).getAttribute('href');
        }

  const clickKey = `ui_click:${analyticsId ?? text ?? el.tagName}:${page}`;
  if (!shouldSendGlobal(clickKey, 1000)) return;

        void recordUserAction({
          eventType: 'ui_click',
          eventDetails: info,
          eventDescription: `UI click: ${analyticsId ?? text ?? el.tagName}`
        });
      } catch (err) {
        // swallow errors from analytics handler to avoid breaking the app
        console.warn('analytics click handler error', err);
      }
    };

    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, []);
}
