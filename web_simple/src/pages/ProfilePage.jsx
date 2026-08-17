/**
 * Profile page component - DesignStitch User Profile design
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import { useAuthStore } from '../state/authStore';
import Card from '../components/design-system/Card';
import InputField from '../components/design-system/InputField';
import Button from '../components/design-system/Button';
import StatusBadge from '../components/design-system/StatusBadge';

function ProfilePage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authAPI.getProfile();
      return response.data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || user?.name || '',
        email: profile.email || user?.email || '',
        bio: profile.bio || user?.bio || '',
      });
    }
  }, [profile, user]);

  const updateMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: () => {
      setIsEditing(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent 
                      rounded-full animate-spin"></div>
      </div>
    );
  }

  const displayData = profile || formData;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-xl">
        <h1 className="text-headline-lg font-headline-lg text-primary">
          User Profile
        </h1>
        <p className="text-body-sm font-body-sm text-on-surface-variant mt-xs">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Card */}
      <Card elevation="medium" padding="xl">
        <div className="space-y-xl">
          {/* Profile Header */}
          <div className="flex items-center gap-lg pb-xl border-b border-surface-variant">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center 
                          justify-center text-on-primary text-headline-lg">
              {displayData.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-headline-md font-headline-md text-primary">
                {displayData.name || 'User Name'}
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                {displayData.email || 'user@example.com'}
              </p>
              <div className="mt-sm">
                <StatusBadge status="Active" variant="published" />
              </div>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <span className="material-symbols-outlined">{isEditing ? 'close' : 'edit'}</span>
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          {/* Profile Form */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-lg">
              <InputField
                label="Full Name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              
              <InputField
                label="Email Address"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              
              <div className="space-y-xs">
                <label className="block text-label-caps font-label-caps 
                                    text-on-surface-variant uppercase tracking-widest">
                  Bio
                </label>
                <textarea
                  className="w-full min-h-[100px] p-md bg-surface border border-outline-variant 
                             rounded-lg text-body-md text-on-surface focus:outline-none 
                             focus:border-secondary focus:ring-1 focus:ring-secondary 
                             resize-y"
                  name="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={handleChange}
                />
              </div>

              <div className="flex gap-sm pt-sm">
                <Button 
                  variant="primary"
                  type="submit"
                  disabled={updateMutation.isLoading}
                >
                  {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setFormData({
                      name: profile?.name || '',
                      email: profile?.email || '',
                      bio: profile?.bio || '',
                    });
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-lg">
              <div>
                <h3 className="text-label-caps font-label-caps text-on-surface-variant mb-xs">
                  Full Name
                </h3>
                <p className="text-body-md text-on-surface">{displayData.name || 'Not set'}</p>
              </div>
              
              <div>
                <h3 className="text-label-caps font-label-caps text-on-surface-variant mb-xs">
                  Email Address
                </h3>
                <p className="text-body-md text-on-surface">{displayData.email || 'Not set'}</p>
              </div>
              
              <div>
                <h3 className="text-label-caps font-label-caps text-on-surface-variant mb-xs">
                  Bio
                </h3>
                <p className="text-body-md text-on-surface">{displayData.bio || 'No bio provided'}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Account Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mt-lg">
        <Card elevation="small" padding="lg">
          <div className="text-center">
            <div className="text-headline-lg font-headline-lg text-primary mb-xs">
              {profile?.document_count || 0}
            </div>
            <div className="text-label-caps font-label-caps text-on-surface-variant">
              Documents
            </div>
          </div>
        </Card>
        
        <Card elevation="small" padding="lg">
          <div className="text-center">
            <div className="text-headline-lg font-headline-lg text-primary mb-xs">
              {profile?.published_count || 0}
            </div>
            <div className="text-label-caps font-label-caps text-on-surface-variant">
              Published
            </div>
          </div>
        </Card>
        
        <Card elevation="small" padding="lg">
          <div className="text-center">
            <div className="text-headline-lg font-headline-lg text-primary mb-xs">
              {profile?.member_since || '2023'}
            </div>
            <div className="text-label-caps font-label-caps text-on-surface-variant">
              Member Since
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ProfilePage;
