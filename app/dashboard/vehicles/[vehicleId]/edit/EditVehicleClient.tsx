"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Vehicle = {
  id: string
  name: string
  make: string | null
  model: string | null
  year: number | null
  licensePlate: string | null
  oilChangeInterval: number
}

export default function EditVehicleClient({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: vehicle.name,
    make: vehicle.make || "",
    model: vehicle.model || "",
    year: vehicle.year?.toString() || "",
    licensePlate: vehicle.licensePlate || "",
    oilChangeInterval: vehicle.oilChangeInterval.toString(),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!formData.name) {
      setError("Vehicle name is required")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/vehicles/" + vehicle.id, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to update vehicle")
      }

      router.push("/dashboard/vehicles/" + vehicle.id)
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Vehicle Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"                placeholder="e.g., Kia K5 2021"
              />
              <p className="mt-1 text-sm text-gray-500">
                A friendly name to identify this vehicle
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700">
                  Make
                </label>
                <input
                  type="text"
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Kia"
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"                  placeholder="e.g., K5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"                  placeholder="e.g., 2021"
                  min="1900"
                  max="2030"
                />
              </div>

              <div>
                <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">
                  License Plate
                </label>
                <input
                  type="text"
                  id="licensePlate"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"                  placeholder="e.g., ABC1234"
                />
              </div>
            </div>

            <div>
              <label htmlFor="oilChangeInterval" className="block text-sm font-medium text-gray-700">
                Oil Change Interval (miles)
              </label>
              <input
                type="number"
                id="oilChangeInterval"
                name="oilChangeInterval"
                value={formData.oilChangeInterval}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"                placeholder="3000"
                min="1000"
                max="15000"
              />
              <p className="mt-1 text-sm text-gray-500">
                Adjust based on your vehicle's requirements.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
