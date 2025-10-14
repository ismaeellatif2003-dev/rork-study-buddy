'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Shield, HelpCircle, LogOut, Moon, Sun, Edit3, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getUserProfile, updateUserProfile, getEducationLevels, type UserProfile } from '@/utils/userProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState({
    studyReminders: true,
    newFeatures: true,
    weeklyReports: false,
  });
  const [darkMode, setDarkMode] = useState(false);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('studyBuddyDarkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('studyBuddyDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    age: '',
    educationLevel: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load user profile on component mount
  useEffect(() => {
    const profile = getUserProfile();
    setUserProfile(profile);
    setEditForm({
      name: profile.name,
      email: profile.email,
      age: profile.age?.toString() || '',
      educationLevel: profile.educationLevel,
    });
  }, []);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (e: CustomEvent) => {
      setUserProfile(e.detail);
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
      router.push('/');
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditForm({
      name: userProfile.name,
      email: userProfile.email,
      age: userProfile.age?.toString() || '',
      educationLevel: userProfile.educationLevel,
    });
  };

  const handleSaveProfile = () => {
    const updatedProfile = {
      name: editForm.name,
      email: editForm.email,
      age: editForm.age ? parseInt(editForm.age) : null,
      educationLevel: editForm.educationLevel,
      accountType: userProfile.accountType,
    };
    
    updateUserProfile(updatedProfile);
    setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditForm({
      name: userProfile.name,
      email: userProfile.email,
      age: userProfile.age?.toString() || '',
      educationLevel: userProfile.educationLevel,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

        {/* Sign In Section for Unauthenticated Users */}
        {!isAuthenticated && !isLoading && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <User className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sign In Required</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Sign in to access your settings and sync your data</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <GoogleSignIn 
                text="Sign in with Google"
                className="w-full bg-blue-600 text-white hover:bg-blue-700 border-0 font-medium py-3 px-4 rounded-lg shadow-sm transition-colors"
              />
            </CardContent>
          </Card>
        )}

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="text-blue-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your account information</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isEditingProfile ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{userProfile.name}</div>
                    <div className="text-sm text-gray-600">{userProfile.email}</div>
                  </div>
                  <Button size="sm" onClick={handleEditProfile} className="bg-gray-600 text-white hover:bg-gray-700">
                    <Edit3 size={16} className="mr-1" />
                    Edit Profile
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium text-gray-900">Age</div>
                    <div className="text-sm text-gray-600">
                      {userProfile.age ? `${userProfile.age} years old` : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Education Level</div>
                    <div className="text-sm text-gray-600">
                      {userProfile.educationLevel ? 
                        getEducationLevels().find(level => level.value === userProfile.educationLevel)?.label || userProfile.educationLevel
                        : 'Not specified'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Account Type</div>
                    <div className="text-sm text-gray-600">{userProfile.accountType}</div>
                  </div>
                  <Button size="sm" onClick={() => window.location.href = '/subscription'} className="bg-blue-600 text-white hover:bg-blue-700">
                    Upgrade to Pro
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <Input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Enter your age"
                    min="1"
                    max="120"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                  <select
                    value={editForm.educationLevel}
                    onChange={(e) => setEditForm(prev => ({ ...prev, educationLevel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {getEducationLevels().map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} className="bg-green-600 text-white hover:bg-green-700">
                    <Save size={16} className="mr-1" />
                    Save Changes
                  </Button>
                  <Button onClick={handleCancelEdit} className="bg-gray-600 text-white hover:bg-gray-700">
                    <X size={16} className="mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bell className="text-green-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <p className="text-gray-600 text-sm">Choose what notifications you receive</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Study Reminders</div>
                <div className="text-sm text-gray-600">Get reminded to study regularly</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.studyReminders}
                  onChange={() => handleNotificationChange('studyReminders')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">New Features</div>
                <div className="text-sm text-gray-600">Learn about new features and updates</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.newFeatures}
                  onChange={() => handleNotificationChange('newFeatures')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Weekly Reports</div>
                <div className="text-sm text-gray-600">Get weekly summaries of your study progress</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.weeklyReports}
                  onChange={() => handleNotificationChange('weeklyReports')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                {darkMode ? <Moon className="text-purple-600" size={20} /> : <Sun className="text-purple-600" size={20} />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
                <p className="text-gray-600 text-sm">Customize how the app looks</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Dark Mode</div>
                <div className="text-sm text-gray-600">Switch between light and dark themes</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="text-red-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Privacy & Security</h2>
                <p className="text-gray-600 text-sm">Manage your data and privacy settings</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start bg-blue-600 text-white hover:bg-blue-700">
              <Shield size={16} className="mr-2" />
              Privacy Policy
            </Button>
            <Button className="w-full justify-start bg-blue-600 text-white hover:bg-blue-700">
              <Shield size={16} className="mr-2" />
              Terms of Service
            </Button>
            <Button className="w-full justify-start bg-blue-600 text-white hover:bg-blue-700">
              <Shield size={16} className="mr-2" />
              Data Export
            </Button>
            <Button className="w-full justify-start bg-red-600 text-white hover:bg-red-700">
              <Shield size={16} className="mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <HelpCircle className="text-yellow-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Support</h2>
                <p className="text-gray-600 text-sm">Get help and contact support</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start bg-blue-600 text-white hover:bg-blue-700">
              <HelpCircle size={16} className="mr-2" />
              Help Center
            </Button>
            <Button className="w-full justify-start bg-blue-600 text-white hover:bg-blue-700">
              <HelpCircle size={16} className="mr-2" />
              Contact Support
            </Button>
            <Button className="w-full justify-start bg-blue-600 text-white hover:bg-blue-700">
              <HelpCircle size={16} className="mr-2" />
              Report a Bug
            </Button>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardContent className="p-6">
            <Button
              onClick={handleSignOut}
              className="w-full justify-start bg-red-600 text-white hover:bg-red-700"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
