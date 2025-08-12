'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Play, 
  LogOut, 
  Star, 
  Clock, 
  Sparkles,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  Timer,
  Pause,
  Square,
  RefreshCw,
  Activity,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { adminAPI, publicAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface NumberRange {
  id: number
  range_value: string
  category: string
  created_at: string
  updated_at: string
  extra_data?: any
}

interface BalanceData {
  success: boolean
  today_balance: number
  today_otp: number
  today_date: string
  total_balance: number
}

export default function HomePage() {
  const { isAuthenticated, logout, isLoading } = useAuth()
  const router = useRouter()
  const [currentRange, setCurrentRange] = useState('')
  const [ranges, setRanges] = useState<{
    favorites: NumberRange[]
    recents: NumberRange[]
    special: NumberRange[]
  }>({
    favorites: [],
    recents: [],
    special: []
  })
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [testNumbers, setTestNumbers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [timerInterval, setTimerInterval] = useState(2)
  const [activeTab, setActiveTab] = useState<'favorites' | 'special'>('favorites')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  const fetchData = async () => {
    if (!isAuthenticated) return
    
    try {
      const [favs, recents, special, balanceData, testData] = await Promise.all([
        adminAPI.getRanges('favorites'),
        adminAPI.getRanges('recents'),
        adminAPI.getRanges('special'),
        adminAPI.getBalance(),
        adminAPI.getTestNumbers()
      ])
      
      setRanges({
        favorites: favs,
        recents: recents,
        special: special
      })
      
      if (balanceData.success) {
        setBalance(balanceData)
      }
      
      if (testData.success) {
        setTestNumbers(testData.working_numbers?.slice(0, 10) || [])
      }
    } catch (error) {
      console.error('Failed to fetch data')
    }
  }

  const applyRange = async () => {
    if (!currentRange.trim()) {
      toast.error('Please enter a number range')
      return
    }

    try {
      const result = await publicAPI.fetchNumberWithRange(currentRange)
      toast.success('Number fetched successfully!')
      console.log('Result:', result)
    } catch (error) {
      toast.error('Failed to fetch number')
    }
  }

  const addToCategory = async (category: string) => {
    if (!currentRange.trim()) {
      toast.error('Please enter a number range')
      return
    }

    try {
      await adminAPI.createRange({
        range_value: currentRange.trim(),
        category: category,
        extra_data: { timestamp: new Date().toISOString() }
      })
      
      setCurrentRange('')
      await fetchData()
      toast.success(`Added to ${category}`)
    } catch (error) {
      toast.error('Failed to add range')
    }
  }

  const deleteRange = async (id: number) => {
    try {
      await adminAPI.deleteRange(id)
      await fetchData()
      toast.success('Range deleted')
    } catch (error) {
      toast.error('Failed to delete range')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      toast.success('Copied!')
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const startTimer = async (category: string) => {
    try {
      await adminAPI.startTimer(category, timerInterval)
      toast.success(`Timer started for ${category}`)
    } catch (error) {
      toast.error('Failed to start timer')
    }
  }

  const stopTimer = async (category: string) => {
    try {
      await adminAPI.stopTimer(category)
      toast.success(`Timer stopped for ${category}`)
    } catch (error) {
      toast.error('Failed to stop timer')
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">NF</span>
              </div>
              <h1 className="text-xl font-bold text-gray-100">Number Fetcher - Modern Compact</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status Indicators */}
              <div className="flex items-center space-x-2">
                <span className="status-running text-xs">● Server Running</span>
                {balance && (
                  <>
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      Today: ${balance.today_balance?.toFixed(3)} ({balance.today_otp} OTP)
                    </span>
                    <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                      Total: ${balance.total_balance?.toFixed(3)}
                    </span>
                  </>
                )}
              </div>
              
              <button
                onClick={logout}
                className="btn-danger flex items-center space-x-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Input Section */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              value={currentRange}
              onChange={(e) => setCurrentRange(e.target.value)}
              placeholder="Enter number range (e.g., 96777xxxxXXXX)"
              className="flex-1 input-field"
              onKeyPress={(e) => e.key === 'Enter' && applyRange()}
            />
            
            <div className="flex gap-2">
              <button
                onClick={applyRange}
                className="btn-primary bg-green-600 hover:bg-green-700 flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Apply</span>
              </button>
              
              <button
                onClick={() => addToCategory('favorites')}
                className="btn-primary bg-purple-600 hover:bg-purple-700 flex items-center space-x-2"
              >
                <Star className="w-4 h-4" />
                <span>♥ Fav</span>
              </button>
              
              <button
                onClick={() => addToCategory('special')}
                className="btn-primary bg-pink-600 hover:bg-pink-700 flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>★ Special</span>
              </button>
            </div>
          </div>

          {/* Test Numbers Row */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={fetchData}
              className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <div className="flex space-x-2">
              {testNumbers.map((num, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentRange(num.test_number)
                    copyToClipboard(num.test_number)
                  }}
                  className="flex-shrink-0 bg-dark-700 hover:bg-dark-600 text-gray-300 px-3 py-1 rounded text-sm font-mono transition-colors"
                >
                  {num.test_number}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-dark-800 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'favorites' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Favourites
          </button>
          <button
            onClick={() => setActiveTab('special')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'special' 
                ? 'bg-pink-600 text-white' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Special
          </button>
        </div>

        {/* Active Tab Content */}
        <div className="card">
          {/* Timer Controls */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-100 capitalize">
              {activeTab} - Timer Controls
            </h3>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={timerInterval}
                  onChange={(e) => setTimerInterval(parseInt(e.target.value) || 2)}
                  min="1"
                  max="60"
                  className="input-field w-16 text-center"
                />
                <span className="text-sm text-gray-400">m</span>
                <input
                  type="number"
                  defaultValue={30}
                  min="0"
                  max="59"
                  className="input-field w-16 text-center"
                />
                <span className="text-sm text-gray-400">s</span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => startTimer(activeTab)}
                  className="btn-primary bg-green-600 hover:bg-green-700 flex items-center space-x-1 px-3 py-1"
                >
                  <Play className="w-3 h-3" />
                  <span>Start</span>
                </button>
                
                <button className="btn-secondary flex items-center space-x-1 px-3 py-1">
                  <Pause className="w-3 h-3" />
                  <span>Smart</span>
                </button>
                
                <button className="btn-secondary flex items-center space-x-1 px-3 py-1">
                  <Square className="w-3 h-3" />
                  <span>Randomize</span>
                </button>
                
                <button className="btn-secondary flex items-center space-x-1 px-3 py-1">
                  <Timer className="w-3 h-3" />
                  <span>Alphabetical</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ranges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {ranges[activeTab].map((range) => (
              <div
                key={range.id}
                className={`
                  relative group rounded-lg p-3 transition-all cursor-pointer
                  ${activeTab === 'favorites' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-pink-600 hover:bg-pink-700'
                  }
                `}
                onClick={() => {
                  setCurrentRange(range.range_value)
                  copyToClipboard(range.range_value)
                }}
              >
                <div className="text-white font-mono text-sm text-center">
                  {range.range_value}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteRange(range.id)
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>

          {ranges[activeTab].length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No {activeTab} ranges added yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}