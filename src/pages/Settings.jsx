import { useEffect, useState } from 'react';
import { settingsAPI } from '../services/api';
import Swal from 'sweetalert2';

function Settings() {
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newToken, setNewToken] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    timezone: '',
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    fetchSettings();
    fetchUserProfile();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      setSettings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setUser(data);
      setProfileForm({
        name: data.name,
        email: data.email,
        timezone: data.timezone || 'Asia/Singapore',
        password: '',
        password_confirmation: '',
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validate password match if changing password
    if (profileForm.password && profileForm.password !== profileForm.password_confirmation) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Passwords do not match'
      });
      return;
    }

    try {
      const updateData = {
        name: profileForm.name,
        email: profileForm.email,
        timezone: profileForm.timezone,
      };

      // Only include password if it's being changed
      if (profileForm.password) {
        updateData.password = profileForm.password;
        updateData.password_confirmation = profileForm.password_confirmation;
      }

      const response = await fetch('http://localhost:8000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Profile updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
        setShowProfileModal(false);
        fetchUserProfile();
        // Clear password fields
        setProfileForm(prev => ({
          ...prev,
          password: '',
          password_confirmation: '',
        }));
      } else {
        const error = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to update profile'
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update profile. Please try again.'
      });
    }
  };

  const handleRegenerateToken = async () => {
    const result = await Swal.fire({
      title: 'Regenerate Token?',
      text: 'This will require updating ALL players with the new token.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, regenerate',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await settingsAPI.regeneratePlayerToken();
      setNewToken(response.data.token);
      setShowTokenModal(true);
      fetchSettings();
    } catch (error) {
      console.error('Error regenerating token:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to regenerate token. Please try again.'
      });
    }
  };

  const copyToken = async (token) => {
    await navigator.clipboard.writeText(token);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'Token copied to clipboard',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const copyPlayerUrl = async () => {
    const url = `${window.location.protocol}//${window.location.hostname}:8080`;
    await navigator.clipboard.writeText(url);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'Player URL copied to clipboard',
      timer: 1500,
      showConfirmButton: false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 font-body">Loading settings...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-heading text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600 font-body">Configure your digital signage system</p>
      </div>

      <div className="space-y-6">
        {/* User Profile */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-heading text-gray-900 mb-2">User Profile</h2>
              <p className="text-gray-600 font-body">
                Manage your account information and timezone settings
              </p>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-body font-semibold text-sm whitespace-nowrap"
            >
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Name</label>
              <div className="text-gray-900 font-body">{user?.name}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Email</label>
              <div className="text-gray-900 font-body">{user?.email}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Role</label>
              <div className="text-gray-900 font-body capitalize">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-body font-semibold ${
                  user?.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {user?.role === 'superadmin' ? 'Super Admin' : 'User'}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Timezone</label>
              <div className="text-gray-900 font-body">{user?.timezone || 'Asia/Singapore'}</div>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-body font-semibold text-blue-900 mb-1">Timezone Information</h3>
                <p className="font-body text-sm text-blue-800">
                  Your timezone setting affects how dates and times are displayed throughout the CMS, backend, and player. 
                  All schedules will use this timezone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Player Token */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-heading text-gray-900 mb-2">Global Player Token</h2>
              <p className="text-gray-600 font-body">
                This token is used by all players to authenticate with the API. Configure each player once with this token.
              </p>
            </div>
            <button
              onClick={handleRegenerateToken}
              className="px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors font-body font-semibold text-sm whitespace-nowrap"
            >
              Regenerate Token
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Current Token</label>
                <div className="font-mono text-sm text-gray-900 break-all">
                  {settings?.global_player_token}
                </div>
              </div>
              <button
                onClick={() => copyToken(settings?.global_player_token)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-body font-semibold text-sm"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-body font-semibold text-blue-900 mb-2">How to Configure Players</h3>
            <ol className="font-body text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Copy the global player token above</li>
              <li>Open your player in a browser</li>
              <li>Paste the token when prompted</li>
              <li>The player will auto-register and start displaying content</li>
              <li>Use the same token for all your players (one-time setup per player)</li>
            </ol>
          </div>
        </div>

        {/* API Configuration */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-heading text-gray-900 mb-4">API Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-body font-semibold text-gray-700 mb-2">API URL</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-gray-50 rounded-xl font-mono text-sm text-gray-900">
                  {settings?.api_url}
                </div>
                <button
                  onClick={() => copyToken(settings?.api_url)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-body font-semibold text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Player URL</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-gray-50 rounded-xl font-mono text-sm text-gray-900">
                  {window.location.protocol}//{window.location.hostname}:8080
                </div>
                <button
                  onClick={copyPlayerUrl}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-body font-semibold text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 font-body mt-2">
                Open this URL on your display devices to run the player
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-body font-semibold text-yellow-900 mb-1">Security Notice</h3>
              <p className="font-body text-sm text-yellow-800">
                Keep your global player token secure. Anyone with this token can register displays and access content. 
                If compromised, regenerate the token immediately and update all players.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Regeneration Modal */}
      {showTokenModal && newToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowTokenModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-2xl font-heading text-gray-900">New Global Player Token</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-body font-semibold text-red-900 mb-1">Important: Update All Players</h3>
                    <p className="font-body text-sm text-red-800">
                      The old token is now invalid. You must update ALL players with this new token or they will stop working.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-body font-semibold text-gray-700 mb-2">New Global Token</label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={newToken}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl font-mono text-sm text-gray-900 resize-none"
                    rows="3"
                  />
                  <button
                    onClick={() => copyToken(newToken)}
                    className="absolute top-2 right-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-body font-semibold text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-body font-semibold text-blue-900 mb-2">Next Steps</h3>
                <ol className="font-body text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Copy the new token above</li>
                  <li>Visit each player device</li>
                  <li>Clear the old token (or refresh the page)</li>
                  <li>Enter the new token</li>
                  <li>Players will reconnect automatically</li>
                </ol>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end rounded-b-2xl">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-body font-semibold"
              >
                I've Copied the Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-2xl font-heading text-gray-900">Edit Profile</h2>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Timezone</label>
                  <select
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({...profileForm, timezone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                    required
                  >
                    <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                    <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                    <option value="Asia/Hong_Kong">Asia/Hong Kong (UTC+8)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                    <option value="Asia/Seoul">Asia/Seoul (UTC+9)</option>
                    <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                    <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                    <option value="Asia/Jakarta">Asia/Jakarta (UTC+7)</option>
                    <option value="Asia/Kuala_Lumpur">Asia/Kuala Lumpur (UTC+8)</option>
                    <option value="America/New_York">America/New York (UTC-5)</option>
                    <option value="America/Los_Angeles">America/Los Angeles (UTC-8)</option>
                    <option value="America/Chicago">America/Chicago (UTC-6)</option>
                    <option value="Europe/London">Europe/London (UTC+0)</option>
                    <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                    <option value="Australia/Sydney">Australia/Sydney (UTC+11)</option>
                    <option value="UTC">UTC (UTC+0)</option>
                  </select>
                  <p className="text-xs text-gray-500 font-body mt-2">
                    This timezone will be used for all schedules and time displays
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-5">
                  <h3 className="text-sm font-body font-semibold text-gray-700 mb-3">Change Password (Optional)</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-body font-semibold text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        value={profileForm.password}
                        onChange={(e) => setProfileForm({...profileForm, password: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                        placeholder="Leave blank to keep current password"
                        minLength="6"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={profileForm.password_confirmation}
                        onChange={(e) => setProfileForm({...profileForm, password_confirmation: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
                        placeholder="Confirm new password"
                        minLength="6"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-body font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-body font-semibold"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
