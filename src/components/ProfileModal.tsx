import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, Edit2, Save, Palette } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../hooks/useTracking';
import ThemeSelector from './ThemeSelector';
import AuthInput from './auth/AuthInput';
import AuthButton from './auth/AuthButton';
import { useTheme } from '../hooks/useTheme';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  full_name: string;
  phone_number: string;
  email?: string;
  created_at: string;
  visit_count: number;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const {currentTheme} = useTheme();
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Get user details from unique_visitors
        const { data: visitorData, error } = await supabase
          .from('unique_visitors')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else if (visitorData) {
          const profileData: UserProfile = {
            full_name: visitorData.full_name || 'User',
            phone_number: visitorData.phone_number || '',
            email: session.user.email || '',
            created_at: visitorData.created_at,
            visit_count: visitorData.visit_count || 0
          };
          
          setProfile(profileData);
          setEditForm({
            full_name: profileData.full_name,
            phone_number: profileData.phone_number
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.full_name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Update visitor record
        const { error: updateError } = await supabase
          .from('unique_visitors')
          .update({
            full_name: editForm.full_name.trim(),
            phone_number: editForm.phone_number
          })
          .eq('auth_user_id', session.user.id);

        if (updateError) {
          throw updateError;
        }

        // Update auth user metadata
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: editForm.full_name.trim(),
            phone_number: editForm.phone_number
          }
        });

        if (authError) {
          console.warn('Could not update auth metadata:', authError);
        }

        // Refresh profile
        await fetchProfile();
        setEditing(false);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Profile</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="text-center">
              <div className={`w-20 h-20 bg-gradient-to-br ${currentTheme.buttonGradient} rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4`}>
                {getFirstName(profile.full_name).charAt(0).toUpperCase()}
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
                {editing ? 'Edit Profile' : `Hello, ${getFirstName(profile.full_name)}!`}
              </h4>
              <p className="text-gray-600 text-sm">
                Member since {formatDate(profile.created_at)}
              </p>
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              {editing ? (
                <>
                  <AuthInput
                    type="text"
                    value={editForm.full_name}
                    onChange={(value) => setEditForm({...editForm, full_name: value})}
                    placeholder="Full Name"
                    required
                    disabled={saving}
                    icon={<User className="w-4 h-4" />}
                  />
                  
                  <AuthInput
                    type="tel"
                    value={editForm.phone_number}
                    onChange={(value) => setEditForm({...editForm, phone_number: value})}
                    placeholder="Phone Number"
                    disabled={saving}
                    icon={<Phone className="w-4 h-4" />}
                  />

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Full Name</p>
                      <p className="text-gray-900">{profile.full_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phone Number</p>
                      <p className="text-gray-900">{profile.phone_number || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* {profile.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-gray-900 text-sm break-all">{profile.email}</p>
                      </div>
                    </div>
                  )} */}

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Activity</p>
                      <p className="text-gray-900">{profile.visit_count} visits</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme Customization */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-gray-600" />
                <h5 className="font-semibold text-gray-900">Theme Customization</h5>
              </div>
              <ThemeSelector />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              {editing ? (
                <>
                  <AuthButton
                    variant="secondary"
                    onClick={() => {
                      setEditing(false);
                      setError('');
                      setEditForm({
                        full_name: profile.full_name,
                        phone_number: profile.phone_number
                      });
                    }}
                    disabled={saving}
                    fullWidth
                  >
                    Cancel
                  </AuthButton>
                  <AuthButton
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                    loading={saving}
                    fullWidth
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </AuthButton>
                </>
              ) : (
                <>
                  <AuthButton
                    variant="secondary"
                    onClick={onClose}
                    fullWidth
                  >
                    Close
                  </AuthButton>
                  <AuthButton
                    variant="primary"
                    onClick={() => setEditing(true)}
                    fullWidth
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </AuthButton>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Unable to load profile</p>
          </div>
        )}
      </div>
    </div>
  );
}