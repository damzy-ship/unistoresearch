import { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, Calendar, Palette, Sparkles, Wand2, Store, BadgeCheck, Clock, XCircle, Edit2, Eye, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, UniqueVisitor } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import ThemeCard from '../components/ThemeCard';
import AIThemeGenerator from '../components/AIThemeGenerator';
import EditBrandNameModal from '../components/EditBrandNameModal';
import EditEmailModal from '../components/EditEmailModal';
import VerifyIDModal from '../components/VerifyIdModal';



export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentTheme, themes, backgroundTextures, backgroundTexture, changeTheme, changeBackgroundTexture, setCustomTheme, generateAITheme } = useTheme();
  const [profile, setProfile] = useState<UniqueVisitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'themes' | 'textures' | 'ai'>('themes');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: visitorData, error } = await supabase
          .from('unique_visitors')
          .select('*, user_type, brand_name')
          .eq('auth_user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else if (visitorData) {
          const profileData: UniqueVisitor = {
            full_name: visitorData.full_name || 'User',
            phone_number: visitorData.phone_number || '',
            created_at: visitorData.created_at,
            visit_count: visitorData.visit_count || 0,
            user_type: visitorData.user_type,
            brand_name: visitorData.brand_name,
            verification_status: visitorData.verification_status,
            verification_id: visitorData.verification_id,
            email: visitorData.email || session.user.email
          };

          setProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBrandName = async (newBrandName: string) => {
    if (!profile) return;

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { error } = await supabase
        .from('unique_visitors')
        .update({ brand_name: newBrandName })
        .eq('auth_user_id', session.user.id);

      if (error) {
        console.error('Error updating brand name:', error);
      } else {
        setProfile({ ...profile, brand_name: newBrandName });
        setIsBrandModalOpen(false);
      }
    }
  };

  const handleUpdateEmail = async (newEmail: string) => {
    if (!profile) return;

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { error } = await supabase
        .from('unique_visitors')
        .update({ email: newEmail })
        .eq('auth_user_id', session.user.id);

      if (error) {
        console.error('Error updating email:', error);
      } else {
        setProfile({ ...profile, email: newEmail });
        setIsEmailModalOpen(false);
      }
    }
  };

  const handleVerifyID = async (uploadedUrl: string) => {
    if (!profile) return;

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      // Update both the verification_status and verification_id
      const { error } = await supabase
        .from('unique_visitors')
        .update({
          verification_status: 'pending',
          verification_id: uploadedUrl
        })
        .eq('auth_user_id', session.user.id);

      if (error) {
        console.error('Error updating verification status:', error);
      } else {
        setProfile({ ...profile, verification_status: 'pending', verification_id: uploadedUrl });
        setIsVerifyModalOpen(false);
      }
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

  const handleThemeSelect = (themeId: string) => {
    changeTheme(themeId);
  };

  const handleTextureSelect = (textureId: string) => {
    changeBackgroundTexture(textureId);
  };

  const handleAITheme = async (description: string) => {
    const aiTheme = await generateAITheme(description);
    if (aiTheme) {
      setCustomTheme(aiTheme);
    }
    return aiTheme;
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: currentTheme.background }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
      </div>
    );
  }

  const getVerificationStatus = (status: 'pending' | 'verified' | 'unverified' | null) => {
    switch (status) {
      case 'verified':
        return { icon: <BadgeCheck className="w-5 h-5 text-green-500" />, text: 'Verified', color: 'text-green-500' };
      case 'pending':
        return { icon: <Clock className="w-5 h-5 text-yellow-500" />, text: 'Pending', color: 'text-yellow-500' };
      case 'unverified':
      default:
        return { icon: <XCircle className="w-5 h-5 text-red-500" />, text: 'Unverified', color: 'text-red-500' };
    }
  };

  const { icon: statusIcon, text: statusText, color: statusColor } = profile?.verification_status ? getVerificationStatus(profile.verification_status) : { icon: null, text: 'Unverified', color: 'text-red-500' };


  return (
    <div
      className="min-h-screen transition-colors duration-300 relative"
      style={{ backgroundColor: currentTheme.background }}
    >
      {/* Background texture overlay */}
      {backgroundTexture.id !== 'none' && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: backgroundTexture.pattern,
            backgroundSize: backgroundTexture.id === 'grid' ? '20px 20px' : '30px 30px',
            opacity: backgroundTexture.opacity,
            color: currentTheme.textSecondary
          }}
        />
      )}

      {/* Header */}
      <div
        className="relative z-10 shadow-sm border-b transition-colors duration-300"
        style={{ backgroundColor: currentTheme.surface }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="transition-colors p-2 rounded-lg hover:bg-opacity-10"
                style={{
                  color: currentTheme.textSecondary,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.primary + '10';
                  e.currentTarget.style.color = currentTheme.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = currentTheme.textSecondary;
                }}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1
                  className="text-xl sm:text-2xl font-bold"
                  style={{ color: currentTheme.text }}
                >
                  Profile & Themes
                </h1>
                <p
                  className="text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  Customize your UniStore experience
                </p>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold">
                <span style={{ color: currentTheme.primary }}>uni</span>
                <span style={{ color: currentTheme.secondary }}>store.</span>
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl p-8 shadow-lg border transition-colors duration-300"
              style={{ backgroundColor: currentTheme.surface }}
            >
              {profile ? (
                <div className="text-center">
                  <div
                    className={`w-24 h-24 bg-gradient-to-br ${currentTheme.buttonGradient} rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-lg`}
                  >
                    {getFirstName(profile.full_name ? profile.full_name : '').charAt(0).toUpperCase()}
                  </div>
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ color: currentTheme.text }}
                  >
                    {getFirstName(profile.full_name ? profile.full_name : '')}
                  </h2>
                  <p
                    className="mb-6"
                    style={{ color: currentTheme.textSecondary }}
                  >
                    Welcome to your personalized space
                  </p>

                  <div className="space-y-4">
                    {/* Email Address */}
                    <div
                      className="flex items-center gap-3 p-4 rounded-xl"
                      style={{ backgroundColor: currentTheme.background }}
                    >
                      <Mail
                        className="w-5 h-5"
                        style={{ color: currentTheme.primary }}
                      />
                      <div className="flex-1 text-left">
                        <p
                          className="text-sm font-medium"
                          style={{ color: currentTheme.textSecondary }}
                        >
                          Email Address
                        </p>
                        <p style={{ color: currentTheme.text }}>
                          {profile.email.slice(0,5) + "***" + profile.email.slice(-8) || 'Not set'}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsEmailModalOpen(true)}
                        className={`text-sm px-3 py-1 rounded-full font-medium transition-colors duration-200`}
                        style={{
                          color: currentTheme.primary,
                          backgroundColor: currentTheme.primary + '10'
                        }}
                      >
                        Change
                      </button>
                    </div>

                    {/* Brand Name for Merchants */}
                    {profile.user_type === 'merchant' && (
                      <div
                        className="flex items-center gap-3 p-4 rounded-xl"
                        style={{ backgroundColor: currentTheme.background }}
                      >
                        <Store
                          className="w-5 h-5"
                          style={{ color: currentTheme.primary }}
                        />
                        <div className="flex-1 text-left">
                          <p
                            className="text-sm font-medium"
                            style={{ color: currentTheme.textSecondary }}
                          >
                            Brand Name
                          </p>
                          <p style={{ color: currentTheme.text }}>
                            {profile.brand_name || 'Not set'}
                          </p>
                        </div>
                        <button
                          onClick={() => setIsBrandModalOpen(true)}
                          className={`text-sm px-3 py-1 rounded-full font-medium transition-colors duration-200`}
                          style={{
                            color: currentTheme.primary,
                            backgroundColor: currentTheme.primary + '10'
                          }}
                        >
                          Change
                        </button>
                      </div>
                    )}

                    {/* Verification Status for Merchants */}
                    {profile.user_type === 'merchant' && (
                      <div
                        className="flex items-center gap-3 p-4 rounded-xl"
                        style={{ backgroundColor: currentTheme.background }}
                      >
                        {statusIcon}
                        <div className="flex-1 text-left">
                          <p
                            className="text-sm font-medium"
                            style={{ color: currentTheme.textSecondary }}
                          >
                            Verification Status
                          </p>
                          <p className={`font-semibold ${statusColor}`}>
                            {statusText}
                          </p>
                        </div>
                        {profile.verification_status === 'pending' && (
                          <div className="flex gap-2">
                          
                            <button
                              onClick={() => setIsVerifyModalOpen(true)}
                              className={`p-2 rounded-full transition-colors duration-200 hover:bg-opacity-20`}
                              style={{ color: currentTheme.primary, backgroundColor: currentTheme.primary + '10' }}
                              title="Change ID"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                        {profile.verification_status === 'unverified' && !profile.verification_id && (
                          <button
                            onClick={() => setIsVerifyModalOpen(true)}
                            className={`text-sm px-3 py-1 rounded-full font-medium transition-colors duration-200`}
                            style={{
                              color: currentTheme.primary,
                              backgroundColor: currentTheme.primary + '10'
                            }}
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    )}

                    {/* User Info sections (Full Name, Phone, etc.) */}
                    <div
                      className="flex items-center gap-3 p-4 rounded-xl"
                      style={{ backgroundColor: currentTheme.background }}
                    >
                      <User
                        className="w-5 h-5"
                        style={{ color: currentTheme.primary }}
                      />
                      <div className="text-left">
                        <p
                          className="text-sm font-medium"
                          style={{ color: currentTheme.textSecondary }}
                        >
                          Full Name
                        </p>
                        <p style={{ color: currentTheme.text }}>{profile.full_name}</p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 p-4 rounded-xl"
                      style={{ backgroundColor: currentTheme.background }}
                    >
                      <Phone
                        className="w-5 h-5"
                        style={{ color: currentTheme.primary }}
                      />
                      <div className="text-left">
                        <p
                          className="text-sm font-medium"
                          style={{ color: currentTheme.textSecondary }}
                        >
                          Phone Number
                        </p>
                        <p style={{ color: currentTheme.text }}>
                          {profile.phone_number || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 p-4 rounded-xl"
                      style={{ backgroundColor: currentTheme.background }}
                    >
                      <Calendar
                        className="w-5 h-5"
                        style={{ color: currentTheme.primary }}
                      />
                      <div className="text-left">
                        <p
                          className="text-sm font-medium"
                          style={{ color: currentTheme.textSecondary }}
                        >
                          Member Since
                        </p>
                        <p style={{ color: currentTheme.text }}>
                          {formatDate(profile.created_at)}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3 p-4 rounded-xl"
                      style={{ backgroundColor: currentTheme.background }}
                    >
                      <Sparkles
                        className="w-5 h-5"
                        style={{ color: currentTheme.primary }}
                      />
                      <div className="text-left">
                        <p
                          className="text-sm font-medium"
                          style={{ color: currentTheme.textSecondary }}
                        >
                          Total Visits
                        </p>
                        <p style={{ color: currentTheme.text }}>{profile.visit_count}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p style={{ color: currentTheme.textSecondary }}>Unable to load profile</p>
                </div>
              )}
            </div>
          </div>

          {/* Theme Customization Section (rest of the code is unchanged) */}
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl p-8 shadow-lg border transition-colors duration-300"
              style={{ backgroundColor: currentTheme.surface }}
            >
              <div className="flex items-center gap-3 mb-8">
                <Palette
                  className="w-6 h-6"
                  style={{ color: currentTheme.primary }}
                />
                <h3
                  className="text-2xl font-bold"
                  style={{ color: currentTheme.text }}
                >
                  Theme Customization
                </h3>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { id: 'themes', label: 'Preset Themes', icon: Palette },
                  { id: 'textures', label: 'Background Textures', icon: Sparkles },
                  { id: 'ai', label: 'AI Generated', icon: Wand2 }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${activeTab === id
                      ? `bg-gradient-to-r ${currentTheme.buttonGradient} text-white shadow-lg`
                      : 'hover:bg-opacity-10'
                      }`}
                    style={activeTab !== id ? {
                      backgroundColor: currentTheme.primary + '10',
                      color: currentTheme.text
                    } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'themes' && (
                <div>
                  <h4
                    className="text-lg font-semibold mb-4"
                    style={{ color: currentTheme.text }}
                  >
                    Choose a Preset Theme
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {themes.map((theme) => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isSelected={currentTheme.id === theme.id}
                        onSelect={() => handleThemeSelect(theme.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'textures' && (
                <div>
                  <h4
                    className="text-lg font-semibold mb-4"
                    style={{ color: currentTheme.text }}
                  >
                    Background Textures
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {backgroundTextures.map((texture) => (
                      <button
                        key={texture.id}
                        onClick={() => handleTextureSelect(texture.id)}
                        className={`relative p-6 rounded-xl border-2 transition-all duration-200 overflow-hidden ${backgroundTexture.id === texture.id
                          ? 'shadow-lg transform scale-105'
                          : 'hover:shadow-md hover:scale-102'
                          }`}
                        style={{
                          backgroundColor: currentTheme.background,
                          borderColor: backgroundTexture.id === texture.id
                            ? currentTheme.primary
                            : currentTheme.textSecondary + '30'
                        }}
                      >
                        {/* Texture Preview */}
                        {texture.id !== 'none' && (
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: texture.pattern,
                              backgroundSize: texture.id === 'grid' ? '10px 10px' : '15px 15px',
                              opacity: texture.opacity * 3,
                              color: currentTheme.textSecondary
                            }}
                          />
                        )}

                        <div
                          className="relative z-10 text-center"
                          style={{ color: currentTheme.text }}
                        >
                          <div className="h-12 mb-2 rounded-lg flex items-center justify-center">
                            {texture.id === 'none' ? (
                              <div className="text-2xl">∅</div>
                            ) : (
                              <div className="text-2xl">◊</div>
                            )}
                          </div>
                          <p className="font-medium text-sm">{texture.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <AIThemeGenerator
                  onThemeGenerated={handleAITheme}
                  currentTheme={currentTheme}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for changing brand name */}
      {isBrandModalOpen && (
        <EditBrandNameModal
          currentBrandName={profile?.brand_name || ''}
          onClose={() => setIsBrandModalOpen(false)}
          onSave={handleUpdateBrandName}
          currentTheme={currentTheme}
        />
      )}

      {isVerifyModalOpen && (
        <VerifyIDModal
          onClose={() => setIsVerifyModalOpen(false)}
          onSave={handleVerifyID}
          currentTheme={currentTheme}
          uniqueId={profile?.full_name || 'user'}
          currentVerificationId={profile?.verification_id}
        />
      )}

      {isEmailModalOpen && (
        <EditEmailModal
          currentEmail={profile?.email || ''}
          onClose={() => setIsEmailModalOpen(false)}
          onSave={handleUpdateEmail}
          currentTheme={currentTheme}
        />
      )}
    </div>
  );
}