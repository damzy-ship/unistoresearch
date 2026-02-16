// import { useEffect } from 'react';
import { supabase, getSafeSession } from '../lib/supabase';

const USER_ID_STORAGE_KEY = 'unistore_user_id';
const ACTUAL_USER_ID_STORAGE_KEY = 'unistore_actual_user_id';

const AUTH_SESSION_KEY = 'unistore_authenticated';

export function generateUniqueId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

let userIdPromise: Promise<string> | null = null;

export async function getUserId(): Promise<string> {
  if (userIdPromise) return userIdPromise;

  userIdPromise = (async (): Promise<string> => {
    try {
      // First check if user is authenticated with Supabase
      const { data: { session } } = await getSafeSession();
      const user_data_id = localStorage.getItem(ACTUAL_USER_ID_STORAGE_KEY);

      if (session?.user?.id) {
        const userId = session.user.id;
        localStorage.setItem(USER_ID_STORAGE_KEY, userId);

        if (!user_data_id || user_data_id === 'undefined') {
          // Fetch or create visitor for this auth user
          const { data: visitor } = await supabase
            .from('unique_visitors')
            .select('id')
            .eq('auth_user_id', userId)
            .maybeSingle();

          if (visitor) {
            localStorage.setItem(ACTUAL_USER_ID_STORAGE_KEY, visitor.id);
            return userId;
          } else {
            // Check if there's an existing guest record to link
            const guestUserId = localStorage.getItem(USER_ID_STORAGE_KEY);
            if (guestUserId && guestUserId !== userId) {
              const { data: updated } = await supabase
                .from('unique_visitors')
                .update({ auth_user_id: userId })
                .eq('user_id', guestUserId)
                .select('id')
                .maybeSingle();

              if (updated) {
                localStorage.setItem(ACTUAL_USER_ID_STORAGE_KEY, updated.id);
                return userId;
              }
            }

            // Create new visitor record linked to auth
            const school_id = localStorage.getItem('selectedSchoolId');
            const { data: newVisitor } = await supabase
              .from('unique_visitors')
              .insert({
                auth_user_id: userId,
                user_id: userId,
                last_visit: new Date().toISOString(),
                visit_count: 1,
                school_id: school_id
              })
              .select('id')
              .single();

            if (newVisitor) {
              localStorage.setItem(ACTUAL_USER_ID_STORAGE_KEY, newVisitor.id);
            }
          }
        }
        return userId;
      }

      // If not authenticated, use the stored guest ID or generate a new one
      let userId = localStorage.getItem(USER_ID_STORAGE_KEY);

      if (!userId || !user_data_id || user_data_id === 'undefined' || user_data_id === 'null') {
        const school_id = localStorage.getItem('selectedSchoolId');
        userId = generateUniqueId();
        localStorage.setItem(USER_ID_STORAGE_KEY, userId);

        const { data: user_data, error: insertError } = await supabase
          .from('unique_visitors')
          .insert({
            user_id: userId,
            last_visit: new Date().toISOString(),
            visit_count: 1,
            school_id: school_id
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error creating visitor record:', insertError);
        } else if (user_data?.id) {
          localStorage.setItem(ACTUAL_USER_ID_STORAGE_KEY, user_data.id);
        }
      }

      return userId || generateUniqueId();
    } catch (err) {
      console.warn('getUserId encountered error:', err);
      return localStorage.getItem(USER_ID_STORAGE_KEY) || generateUniqueId();
    } finally {
      userIdPromise = null;
    }
  })();

  return userIdPromise;
}

export function setUserId(newUserId: string, actualUserId: string): void {
  localStorage.setItem(USER_ID_STORAGE_KEY, newUserId);
  localStorage.setItem(ACTUAL_USER_ID_STORAGE_KEY, actualUserId);
}

export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await getSafeSession();
  return !!session?.user;
}

export function setPhoneAuthenticated(authenticated: boolean): void {
  if (authenticated) {
    localStorage.setItem(AUTH_SESSION_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();

  // Preserve coupon data
  const couponId = localStorage.getItem('hostel_coupon_id');
  const lastPlayed = localStorage.getItem('hostel_coupon_last_played');

  localStorage.clear();

  if (couponId) localStorage.setItem('hostel_coupon_id', couponId);
  if (lastPlayed) localStorage.setItem('hostel_coupon_last_played', lastPlayed);

  window.location.reload();
}

export async function getUserRequestCount(): Promise<number> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('request_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching request count:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error getting user request count:', error);
    return 0;
  }
}

// export function useTracking() {
//   useEffect(() => {
//     const trackVisitor = async () => {
//       const userId = await getUserId();

//       try {
//         const { error: rpcError } = await supabase.rpc('track_visitor_upsert', {
//           p_user_id: userId,
//         });
//         console.log('Tracking visitor with ID:', userId);

//         if (rpcError) {
//           throw rpcError;
//         }

//       } catch (error) {
//         console.error('Error tracking visitor with RPC:', error);
//       }
//     };

//     trackVisitor();
//   }, []); // Only runs on mount
// }