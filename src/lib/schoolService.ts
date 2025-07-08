import { supabase, School } from './supabase';

/**
 * Get all schools
 */
export async function getAllSchools(): Promise<School[]> {
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching schools:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching schools:', error);
    return [];
  }
}

/**
 * Get active schools only
 */
export async function getActiveSchools(): Promise<School[]> {
  try {
    console.log('Attempting to fetch active schools...');
    
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Supabase error fetching active schools:', error);
      return [];
    }

    console.log('Successfully fetched schools:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Network/connection error fetching active schools:', error);
    
    // Check if it's a network connectivity issue
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('This appears to be a network connectivity issue. Please check:');
      console.error('1. Your internet connection');
      console.error('2. Supabase URL in .env file');
      console.error('3. Supabase project status');
    }
    
    return [];
  }
}

/**
 * Add a new school
 */
export async function addSchool(name: string, shortName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('schools')
      .insert({
        name: name.trim(),
        short_name: shortName.trim(),
        is_active: true
      });

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A school with this name or short name already exists'
        };
      }
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding school:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update a school
 */
export async function updateSchool(id: string, name: string, shortName: string, isActive: boolean): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('schools')
      .update({
        name: name.trim(),
        short_name: shortName.trim(),
        is_active: isActive
      })
      .eq('id', id);

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error: 'A school with this name or short name already exists'
        };
      }
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating school:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a school
 */
export async function deleteSchool(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('schools')
      .delete()
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting school:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}