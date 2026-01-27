"use client"

import { useState, useEffect } from "react"
import { requestNotificationPermission } from "@/lib/firebase"

export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if user has already granted permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // Show prompt after 3 seconds
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }
  }, [])

  const handleEnableNotifications = async () => {
    setLoading(true)
    try {
      const token = await requestNotificationPermission()
      
      if (token) {
        // Save token to backend
        await fetch('/api/fcm-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        
        setShowPrompt(false)
        alert('✅ Push notifications enabled!')
      } else {
        alert('❌ Could not enable notifications. Please check your browser settings.')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      alert('❌ Error enabling notifications')
    } finally {
      setLoading(false)
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Enable Push Notifications</h3>
          <p className="text-xs text-gray-600 mt-1">
            Get notified when your vehicles need oil changes
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnableNotifications}
              disabled={loading}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Enabling...' : 'Enable'}
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-xs px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
