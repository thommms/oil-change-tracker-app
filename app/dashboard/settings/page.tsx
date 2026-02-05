"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Logo from "@/components/Logo"

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    notificationMileageThreshold: 200,
    notificationDaysThreshold: 14,
  })

  useEffect(() => {
    setIsLoading(true)
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          emailNotificationsEnabled: data.emailNotificationsEnabled ?? true,
          smsNotificationsEnabled: data.smsNotificationsEnabled ?? false,
          notificationMileageThreshold: data.notificationMileageThreshold ?? 200,
          notificationDaysThreshold: data.notificationDaysThreshold ?? 14,
        })
      })
      .catch((err) => {
        console.error(err)
        setError("Failed to load settings")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
          emailNotificationsEnabled: formData.emailNotificationsEnabled,
          smsNotificationsEnabled: formData.smsNotificationsEnabled,
          notificationMileageThreshold: formData.notificationMileageThreshold,
          notificationDaysThreshold: formData.notificationDaysThreshold,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
          <Logo />
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            ⚙️ Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage your account and notification preferences</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              👤 Account Information
            </h2>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                ✅ Settings saved successfully!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  disabled
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="e.g., +1 (555) 123-4567"
                />
                <p className="mt-1 text-xs text-gray-500">Required for SMS notifications</p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🔔 Notification Preferences
            </h2>

            <div className="space-y-6">
              {/* Email Notifications Toggle */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-600">Receive oil change reminders via email</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      emailNotificationsEnabled: !formData.emailNotificationsEnabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.emailNotificationsEnabled ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.emailNotificationsEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* SMS Notifications Toggle */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                  <p className="text-sm text-gray-600">Receive oil change reminders via text message</p>
                  {!formData.phone && (
                    <p className="text-xs text-orange-600 mt-1">⚠️ Phone number required</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      smsNotificationsEnabled: !formData.smsNotificationsEnabled,
                    })
                  }
                  disabled={!formData.phone}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.smsNotificationsEnabled ? "bg-green-600" : "bg-gray-300"
                  } ${!formData.phone ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.smsNotificationsEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Notification Thresholds */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900">Notification Timing</h3>

                <div>
                  <label htmlFor="mileageThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                    Mileage Alert Threshold
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      id="mileageThreshold"
                      min="50"
                      max="500"
                      step="50"
                      value={formData.notificationMileageThreshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notificationMileageThreshold: parseInt(e.target.value),
                        })
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 min-w-[100px]">
                      {formData.notificationMileageThreshold} miles
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Notify when within this many miles of next oil change
                  </p>
                </div>

                <div>
                  <label htmlFor="daysThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                    Time Alert Threshold
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      id="daysThreshold"
                      min="3"
                      max="30"
                      step="1"
                      value={formData.notificationDaysThreshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notificationDaysThreshold: parseInt(e.target.value),
                        })
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 min-w-[100px]">
                      {formData.notificationDaysThreshold} days
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Notify when within this many days of next oil change
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How Notifications Work</p>
                    <p>You'll be notified when <strong>EITHER</strong> threshold is met - whichever comes first!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
