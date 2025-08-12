'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  LogIn, 
  CheckCircle, 
  XCircle,
  User,
  Key,
  Clock,
  Mail,
  Power,
  PowerOff,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface APIProfile {
  id: number
  name: string
  auth_token: string
  username?: string
  email?: string
  session_expires?: string
  is_active: boolean
  is_logged_in: boolean
  created_at: string
  updated_at: string
  last_login_attempt?: string
  login_status: string
}

export default function ProfilesPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<APIProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState<APIProfile | null>(null)
  const [newProfile, setNewProfile] = useState({ name: '', auth_token: '' })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  const fetchProfiles = async () => {
    try {
      const data = await adminAPI.getProfiles()
      setProfiles(data)
    } catch (error) {
      toast.error('Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async () => {
    if (!newProfile.name.trim() || !newProfile.auth_token.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const result = await adminAPI.createProfile(newProfile)
      setNewProfile({ name: '', auth_token: '' })
      setShowAddForm(false)
      await fetchProfiles()
      
      // Show appropriate toast based on login result
      if (result.login_result?.success) {
        toast.success(`Profile created and logged in successfully!`)
      } else {
        toast.success(`Profile created but login failed: ${result.login_result?.message || 'Unknown error'}`)
      }
    } catch (error) {
      toast.error('Failed to create profile')
    }
  }

  const updateProfile = async () => {
    if (!editingProfile) return

    try {
      const result = await adminAPI.updateProfile(editingProfile.id, {
        name: editingProfile.name,
        auth_token: editingProfile.auth_token
      })
      setEditingProfile(null)
      await fetchProfiles()
      
      // Show appropriate toast based on login result
      if (result.login_result?.success) {
        toast.success(`Profile updated and logged in successfully!`)
      } else if (result.login_result) {
        toast.success(`Profile updated but login failed: ${result.login_result.message}`)
      } else {
        toast.success('Profile updated successfully')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const deleteProfile = async (id: number) => {
    if (!confirm('Are you sure you want to delete this profile?')) return

    try {
      await adminAPI.deleteProfile(id)
      await fetchProfiles()
      toast.success('Profile deleted successfully')
    } catch (error) {
      toast.error('Failed to delete profile')
    }
  }

  const activateProfile = async (id: number) => {
    try {
      await adminAPI.activateProfile(id)
      await fetchProfiles()
      toast.success('Profile activated successfully')
    } catch (error) {
      toast.error('Failed to activate profile')
    }
  }

  const loginProfile = async (id: number) => {
    try {
      const result = await adminAPI.loginProfile(id)
      if (result.success) {
        toast.success('Login successful!')
        await fetchProfiles()
      } else {
        toast.error(result.message || 'Login failed')
      }
    } catch (error) {
      toast.error('Login failed')
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfiles()
    }
  }, [isAuthenticated])

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-gray-100">API Profiles</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="btn-secondary text-sm"
              >
                ← Back to Main
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Add Profile Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Manage API Profiles</h2>
            <p className="text-gray-400">Create and manage your API authentication profiles</p>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Profile</span>
          </button>
        </div>

        {/* Add Profile Form */}
        {showAddForm && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Add New Profile</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                  placeholder="Enter profile name"
                  className="input-field w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Auth Token
                </label>
                <textarea
                  value={newProfile.auth_token}
                  onChange={(e) => setNewProfile({ ...newProfile, auth_token: e.target.value })}
                  placeholder="Enter your auth token (e.g., 69252cf6-1417-43a4-a1ff-209e37a3f9a0)"
                  rows={2}
                  className="input-field w-full resize-none font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This token will be used to authenticate with the itbd.online API
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={createProfile}
                  className="btn-primary"
                >
                  Create Profile
                </button>
                
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewProfile({ name: '', auth_token: '' })
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={`card relative ${
                profile.is_active ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              {/* Active Badge */}
              {profile.is_active && (
                <div className="absolute -top-2 -right-2 bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Active
                </div>
              )}

              {/* Profile Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-100">{profile.name}</h3>
                
                <div className="flex items-center space-x-2">
                  {/* Login Status */}
                  {profile.is_logged_in ? (
                    <CheckCircle className="w-5 h-5 text-green-500" title="Logged in" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" title="Not logged in" />
                  )}
                  
                  {/* Active Status */}
                  {profile.is_active ? (
                    <Power className="w-5 h-5 text-primary-500" title="Active profile" />
                  ) : (
                    <PowerOff className="w-5 h-5 text-gray-500" title="Inactive profile" />
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="space-y-3 mb-4">
                {profile.username && (
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{profile.username}</span>
                  </div>
                )}
                
                {profile.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{profile.email}</span>
                  </div>
                )}
                
                {profile.session_expires && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">
                      Expires: {new Date(profile.session_expires).toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm">
                  <Key className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 font-mono text-xs">
                    {profile.auth_token.length > 30 
                      ? `${profile.auth_token.substring(0, 15)}...${profile.auth_token.slice(-10)}`
                      : profile.auth_token
                    }
                  </span>
                </div>
              </div>

              {/* Login Status - Only show if failed or ready */}
              <div className="mb-4 flex items-center space-x-2">
                {profile.login_status === 'failed' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-white">
                    Login failed
                  </span>
                )}
                
                {profile.is_active && profile.is_logged_in && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-600 text-white">
                    ✓ Ready to use
                  </span>
                )}
                
                {!profile.is_logged_in && profile.login_status !== 'failed' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-600 text-white">
                    Not logged in
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loginProfile(profile.id)}
                  className="btn-primary bg-green-600 hover:bg-green-700 flex items-center space-x-1 text-xs px-3 py-1"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Login</span>
                </button>
                
                {!profile.is_active && (
                  <button
                    onClick={() => activateProfile(profile.id)}
                    className="btn-primary bg-blue-600 hover:bg-blue-700 flex items-center space-x-1 text-xs px-3 py-1"
                  >
                    <Power className="w-3 h-3" />
                    <span>Activate</span>
                  </button>
                )}
                
                <button
                  onClick={() => setEditingProfile(profile)}
                  className="btn-secondary flex items-center space-x-1 text-xs px-3 py-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => deleteProfile(profile.id)}
                  className="btn-danger flex items-center space-x-1 text-xs px-3 py-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {profiles.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No profiles yet</h3>
            <p className="text-gray-500 mb-4">Create your first API profile to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add Your First Profile
            </button>
          </div>
        )}

        {/* Edit Profile Modal */}
        {editingProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="card max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Edit Profile</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Profile Name
                  </label>
                  <input
                    type="text"
                    value={editingProfile.name}
                    onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Auth Token
                  </label>
                  <textarea
                    value={editingProfile.auth_token}
                    onChange={(e) => setEditingProfile({ ...editingProfile, auth_token: e.target.value })}
                    rows={3}
                    className="input-field w-full resize-none"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={updateProfile}
                    className="btn-primary"
                  >
                    Update Profile
                  </button>
                  
                  <button
                    onClick={() => setEditingProfile(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}