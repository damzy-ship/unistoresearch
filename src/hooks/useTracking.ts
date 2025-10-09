import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const USER_ID_STORAGE_KEY = 'unistore_user_id';
const AUTH_SESSION_KEY = 'unistore_authenticated';

export function generateUniqueId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export async function getUserId(): Promise<string> {
  // First check if user is authenticated with Supabase
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user?.id) {
    // If authenticated, use the Supabase user ID
    const userId = session.user.id;
  // console.log(userId)
    localStorage.setItem(USER_ID_STORAGE_KEY, userId);
    return userId;
  }
  
  // If not authenticated, use the stored ID or generate a new one
  let userId = localStorage.getItem(USER_ID_STORAGE_KEY);
  
  if (!userId) {
    userId = generateUniqueId();
    localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  }
  
  return userId;
}

export function setUserId(newUserId: string): void {
  localStorage.setItem(USER_ID_STORAGE_KEY, newUserId);
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

export function useTracking() {
  useEffect(() => {
    const trackVisitor = async () => {
      const userId = await getUserId();
      
      try {
        // Check if visitor exists
        const { data: existingVisitor } = await supabase
          .from('unique_visitors')
          .select('*')
          .eq('user_id', userId)
          .limit(1);

        if (existingVisitor && existingVisitor.length > 0) {
          // Update existing visitor
          await supabase
            .from('unique_visitors')
            .update({
              last_visit: new Date().toISOString(),
              visit_count: existingVisitor[0].visit_count + 1
            })
            .eq('user_id', userId);
        } else {
          // Create new visitor record
          try {
            await supabase
              .from('unique_visitors')
              .insert({
                user_id: userId,
                first_visit: new Date().toISOString(),
                last_visit: new Date().toISOString(),
                visit_count: 1
              });
          } catch (insertError: any) {
            // Handle race condition: if another process already inserted this user_id
            if (insertError?.code === '23505') {
              // Fetch the current record and update it
              const { data: raceConditionVisitor } = await supabase
                .from('unique_visitors')
                .select('visit_count')
                .eq('user_id', userId)
                .limit(1);
              
              if (raceConditionVisitor && raceConditionVisitor.length > 0) {
                await supabase
                  .from('unique_visitors')
                  .update({
                    last_visit: new Date().toISOString(),
                    visit_count: raceConditionVisitor[0].visit_count + 1
                  })
                  .eq('user_id', userId);
              }
            } else {
              // Re-throw other errors
              throw insertError;
            }
          }
        }
      } catch (error) {
        console.error('Error tracking visitor:', error);
      }
    };

    trackVisitor();
  }, []);

  const trackRequest = async (
    university: string, 
    requestText: string, 
    matchedSellerIds?: string[],
    additionalData?: {
      generatedCategories?: string[];
      matchedCategories?: string[];
      sellerCategories?: Record<string, string[]>;
      sellerRankingOrder?: string[];
    }
  ) => {
    const userId = await getUserId();
    
    try {
      const { data, error } = await supabase
        .from('request_logs')
        .insert({
          user_id: userId,
          university,
          request_text: requestText,
          matched_seller_ids: matchedSellerIds || [],
          generated_categories: additionalData?.generatedCategories || [],
          matched_categories: additionalData?.matchedCategories || [],
          seller_categories: additionalData?.sellerCategories || {},
          seller_ranking_order: additionalData?.sellerRankingOrder || [],
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error tracking request:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error tracking request:', error);
      return null;
    }
  };

  return { trackRequest };
}