// import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const USER_ID_STORAGE_KEY = 'unistore_user_id';
const ACTUAL_USER_ID_STORAGE_KEY = 'unistore_actual_user_id';

const AUTH_SESSION_KEY = 'unistore_authenticated';

export function generateUniqueId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export async function getUserId(): Promise<string> {
  // First check if user is authenticated with Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const user_data_id = localStorage.getItem(ACTUAL_USER_ID_STORAGE_KEY);

  if (session?.user?.id) {
    // If authenticated, use the Supabase user ID
    const userId = session.user.id;

    if (!user_data_id) {
      const { data: user_data } = await supabase.from('unique_visitors').select('id').eq('user_id', session?.user?.id).single();

      // console.log(userId) 
      localStorage.setItem(ACTUAL_USER_ID_STORAGE_KEY, user_data?.id);
    }
    localStorage.setItem(USER_ID_STORAGE_KEY, userId);
    return userId;
  }

  // If not authenticated, use the stored ID or generate a new one
  let userId = localStorage.getItem(USER_ID_STORAGE_KEY);


  if (!userId || !user_data_id) {
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
      console.error('Error creating visitor record on login:', insertError);
    } else{
      localStorage.setItem(ACTUAL_USER_ID_STORAGE_KEY, user_data?.id);
    }

  }

  return userId;
}

export function setUserId(newUserId: string, actualUserId: string): void {
  localStorage.setItem(USER_ID_STORAGE_KEY, newUserId);
  localStorage.setItem(ACTUAL_USER_ID_STORAGE_KEY, actualUserId);
}

export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
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
  localStorage.clear();
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