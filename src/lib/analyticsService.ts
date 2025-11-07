import { supabase } from './supabase';

export interface RecordUserActionParams {
  eventType: string;
  eventDetails?: Record<string, unknown>;
  eventDescription?: string;
}

/**
 * Record a user action into the `user_analytics` table.
 * Reads `unistore_actual_user_id` from localStorage when available.
 */
export async function recordUserAction({
  eventType,
  eventDetails = {},
  eventDescription = ''
}: RecordUserActionParams) {
  try {
    const actual_user_id = typeof window !== 'undefined' ? window.localStorage.getItem('unistore_actual_user_id') : null;
    const current_page_url = typeof window !== 'undefined' ? window.location.href : '';

    const payload: {
      actual_user_id: string | null;
      event_type: string;
      event_details: Record<string, unknown>;
      event_description: string;
      current_page_url: string;
      client_event_id?: string;
    } = {
      actual_user_id,
      event_type: eventType,
      event_details: eventDetails ?? {},
      event_description: eventDescription || '',
      current_page_url
    };

    // simple client-side dedupe map (window-scoped) to avoid accidental duplicate inserts
    const PAYLOAD_KEY = '__unistore_analytics_payload_last_sent__';
    const getPayloadMap = () => {
      if (typeof window === 'undefined') return new Map<string, number>();
      const win = window as unknown as Record<string, unknown>;
      let m = win[PAYLOAD_KEY] as Map<string, number> | undefined;
      if (!m) {
        m = new Map<string, number>();
        (win as Record<string, unknown>)[PAYLOAD_KEY] = m;
      }
      return m;
    };

    const hash = JSON.stringify([payload.event_type, payload.current_page_url, payload.event_details, payload.actual_user_id]);
    const map = getPayloadMap();
    const now = Date.now();
    const last = map.get(hash) ?? 0;
    if (now - last < 2000) {
      // recent duplicate — skip sending
      console.debug('Skipping duplicate analytics payload', { eventType, eventDetails });
      return { status: 'skipped', reason: 'duplicate' };
    }
    map.set(hash, now);

    // Insert into Supabase table. We don't wait for long synchronous chains in the UI.
    const { data, error } = await supabase.from('user_analytics').insert([payload]);

    if (error) {
      console.error('Failed to insert analytics event', { eventType, error });
      return { status: 'failed', error };
    }

    return { status: 'success', data };
  } catch (err) {
    console.error('Unexpected analytics error', err);
    return { status: 'error', error: err instanceof Error ? err.message : String(err) };
  }
}

export default recordUserAction;
