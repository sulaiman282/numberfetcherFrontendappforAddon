import axios from 'axios'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      Cookies.remove('access_token')
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login'
      }
    }
    
    // Show error toast for non-auth errors
    if (error.response?.status !== 401) {
      const message = error.response?.data?.detail || error.message || 'An error occurred'
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/api/admin/login', { username, password })
    return response.data
  },
  
  logout: () => {
    Cookies.remove('access_token')
  },
  
  isAuthenticated: () => {
    return !!Cookies.get('access_token')
  },
}

// Public API
export const publicAPI = {
  fetchNumber: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/fetch-number`)
    return response.data
  },
  
  fetchNumberWithRange: async (range: string) => {
    const response = await axios.get(`${API_BASE_URL}/api/fetch-number/range/${range}`)
    return response.data
  },
  
  healthCheck: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/health`)
    return response.data
  },
}

// Admin API
export const adminAPI = {
  getDashboard: async () => {
    const response = await api.get('/api/admin/dashboard')
    return response.data
  },
  
  getRanges: async (category?: string) => {
    const params = category ? { category } : {}
    const response = await api.get('/api/admin/ranges', { params })
    return response.data
  },
  
  createRange: async (data: { range_value: string; category: string; metadata?: any }) => {
    const response = await api.post('/api/admin/ranges', data)
    return response.data
  },
  
  updateRange: async (id: number, data: { range_value?: string; category?: string; metadata?: any }) => {
    const response = await api.put(`/api/admin/ranges/${id}`, data)
    return response.data
  },
  
  deleteRange: async (id: number) => {
    const response = await api.delete(`/api/admin/ranges/${id}`)
    return response.data
  },
  
  getBalance: async () => {
    const response = await api.get('/api/admin/balance')
    return response.data
  },
  
  getTestNumbers: async () => {
    const response = await api.get('/api/admin/test-numbers')
    return response.data
  },
  
  startTimer: async (category: string, intervalMinutes: number) => {
    const response = await api.post('/api/admin/timer/start', null, {
      params: { category, interval_minutes: intervalMinutes }
    })
    return response.data
  },
  
  stopTimer: async (category: string) => {
    const response = await api.post('/api/admin/timer/stop', null, {
      params: { category }
    })
    return response.data
  },

  // Profile Management
  getProfiles: async () => {
    const response = await api.get('/api/admin/profiles')
    return response.data
  },

  createProfile: async (data: { name: string; auth_token: string }) => {
    const response = await api.post('/api/admin/profiles', data)
    return response.data
  },

  updateProfile: async (id: number, data: { name?: string; auth_token?: string }) => {
    const response = await api.put(`/api/admin/profiles/${id}`, data)
    return response.data
  },

  deleteProfile: async (id: number) => {
    const response = await api.delete(`/api/admin/profiles/${id}`)
    return response.data
  },

  activateProfile: async (id: number) => {
    const response = await api.post(`/api/admin/profiles/${id}/activate`)
    return response.data
  },

  loginProfile: async (id: number) => {
    const response = await api.post(`/api/admin/profiles/${id}/login`)
    return response.data
  },

  getActiveProfile: async () => {
    const response = await api.get('/api/admin/profiles/active')
    return response.data
  },
}

export default api