"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function NewVehiclePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    imageUrl: "",
    currentMileage: "",
    oilChangeInterval: "3000",
    oilChangeIntervalMonths: "3",
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setFormData({ ...formData, imageUrl: data.url })
    } catch (error) {
      console.error("Upload error:", error)
      setError("Failed to upload image. Please try again.")
      setImagePreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          make: formData.make || null,
          model: formData.model || null,
          year: formData.year ? parseInt(formData.year) : null,
          licensePlate: formData.licensePlate || null,
          imageUrl: formData.imageUrl || null,
          currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : null,
          oilChangeInterval: parseInt(formData.oilChangeInterval),
          oilChangeIntervalMonths: parseInt(formData.oilChangeIntervalMonths),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create vehicle")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Add New Vehicle</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Vehicle Photo
              </label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                      src={imagePreview}
                      alt="Vehicle preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                <div className="flex-1">
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium inline-block">
                      {isUploading ? "Uploading..." : imagePreview ? "Change Photo" : "Upload Photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                Vehicle Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="e.g., My Honda Civic"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-900 mb-2">
                  Make
                </label>
                <input
                  type="text"
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Honda"
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-900 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Civic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-900 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  placeholder="e.g., 2020"
                />
              </div>

              <div>
                <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-900 mb-2">
                  License Plate
                </label>
                <input
                  type="text"
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  placeholder="e.g., ABC1234"
                />
              </div>
            </div>

            <div>
              <label htmlFor="currentMileage" className="block text-sm font-medium text-gray-900 mb-2">
                Current Mileage
              </label>
              <input
                type="number"
                id="currentMileage"
                value={formData.currentMileage}
                onChange={(e) => setFormData({ ...formData, currentMileage: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="e.g., 50000"
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 Enter your current odometer reading
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="oilChangeInterval" className="block text-sm font-medium text-gray-900 mb-2">
                  Oil Change Interval (Miles) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="oilChangeInterval"
                  required
                  value={formData.oilChangeInterval}
                  onChange={(e) => setFormData({ ...formData, oilChangeInterval: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  placeholder="e.g., 3000"
                />
                <p className="mt-1 text-xs text-gray-500">
                  📏 How often to change oil by mileage
                </p>
              </div>

              <div>
                <label htmlFor="oilChangeIntervalMonths" className="block text-sm font-medium text-gray-900 mb-2">
                  Oil Change Interval (Months) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="oilChangeIntervalMonths"
                  required
                  value={formData.oilChangeIntervalMonths}
                  onChange={(e) => setFormData({ ...formData, oilChangeIntervalMonths: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  placeholder="e.g., 3"
                />
                <p className="mt-1 text-xs text-gray-500">
                  📅 How often to change oil by time
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Oil Change Reminder</p>
                  <p>You'll be notified when <strong>EITHER</strong> condition is met:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Within 200 miles of the mileage interval</li>
                    <li>Within 2 weeks of the time interval</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Create Vehicle"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
