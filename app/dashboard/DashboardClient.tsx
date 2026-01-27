"use client"

import NotificationPrompt from './NotificationPrompt'
import { useState } from "react"
import { useRouter } from "next/navigation"

type OilChange = {
  id: string
  mileageAtChange: number
  dateOfChange: Date
  nextChangeDueAt: number
}

type MileageHistory = {
  id: string
  mileage: number
  createdAt: Date
}

type Vehicle = {
  id: string
  name: string
  make: string | null
  model: string | null
  year: number | null
  currentMileage: number | null
  oilChangeInterval: number
  oilChanges: OilChange[]
  mileageHistory: MileageHistory[]
}

type Session = {
  user: {
    name?: string | null
    email?: string | null
  }
}

export default function DashboardClient({ vehicles, session }: { vehicles: Vehicle[], session: Session }) {
  const router = useRouter()
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [mileageInput, setMileageInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null)

  const vehiclesNeedingService = vehicles.filter(vehicle => {
    if (!vehicle.currentMileage || vehicle.oilChanges.length === 0) return false
    const lastChange = vehicle.oilChanges[0]
    const milesUntilNext = lastChange.nextChangeDueAt - vehicle.currentMileage
    return milesUntilNext <= 200
  })

  const handleUpdateMileage = async () => {
    if (!selectedVehicle || !mileageInput) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/vehicles/" + selectedVehicle.id + "/mileage", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentMileage: mileageInput,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update mileage")
      }

      setSelectedVehicle(null)
      setMileageInput("")
      router.refresh()
    } catch (error) {
      alert("Failed to update mileage")
    } finally {
      setIsLoading(false)
    }
  }

  const openMileageModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setMileageInput("")
  }

  const toggleExpanded = (vehicleId: string) => {
    setExpandedVehicle(expandedVehicle === vehicleId ? null : vehicleId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Car Oil Change Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.name || session.user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm text-red-600 hover:text-red-700 font-medium">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Vehicles</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{vehicles.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Need Service Soon</h3>
            <p className="mt-2 text-3xl font-bold text-yellow-600">{vehiclesNeedingService.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">All Good</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">{vehicles.length - vehiclesNeedingService.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Your Vehicles</h2>
            <a href="/dashboard/vehicles/new" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              Add Vehicle
            </a>
          </div>

          {vehicles.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles yet</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first vehicle to track oil changes</p>
              <a href="/dashboard/vehicles/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                Add Your First Vehicle
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {vehicles.map((vehicle) => {
                const lastChange = vehicle.oilChanges[0]
                const milesUntilNext = lastChange && vehicle.currentMileage
                  ? lastChange.nextChangeDueAt - vehicle.currentMileage
                  : null
                const needsService = milesUntilNext !== null && milesUntilNext <= 200
                const isOverdue = milesUntilNext !== null && milesUntilNext < 0
                const isExpanded = expandedVehicle === vehicle.id

                return (
                  <div key={vehicle.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{vehicle.name}</h3>
                          {isOverdue && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              Overdue!
                            </span>
                          )}
                          {needsService && !isOverdue && (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              Service Soon
                            </span>
                          )}
                        </div>
                        {(vehicle.make || vehicle.model || vehicle.year) && (
                          <p className="text-sm text-gray-500 mt-1">
                            {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-3">
                          <button
                            onClick={() => openMileageModal(vehicle)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Mileage
                          </button>

                          {vehicle.mileageHistory.length > 0 && (
                            <button
                              onClick={() => toggleExpanded(vehicle.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              {isExpanded ? 'Hide' : 'Show'} History ({vehicle.mileageHistory.length})
                              <svg 
                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {isExpanded && vehicle.mileageHistory.length > 0 && (
                          <div className="mt-4 space-y-2 bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Mileage History</h4>
                            {vehicle.mileageHistory.map((history, index) => (
                              <div 
                                key={history.id} 
                                className={`flex items-center justify-between p-2 rounded ${
                                  index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  <span className="font-medium text-gray-900">
                                    {history.mileage.toLocaleString()} miles
                                  </span>
                                  {index === 0 && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(history.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {lastChange && (
                          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                            <span>Last service: {lastChange.mileageAtChange.toLocaleString()} mi</span>
                            {milesUntilNext !== null && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className={`font-medium ${
                                  isOverdue ? 'text-red-600' : 
                                  needsService ? 'text-yellow-600' : 
                                  'text-green-600'
                                }`}>
                                  {milesUntilNext > 0 
                                    ? `${milesUntilNext.toLocaleString()} mi until service` 
                                    : `${Math.abs(milesUntilNext).toLocaleString()} mi overdue!`}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <a href={"/dashboard/vehicles/" + vehicle.id} className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap">
                          View Details
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Current Mileage</h3>
              <button
                onClick={() => {
                  setSelectedVehicle(null)
                  setMileageInput("")
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="font-medium text-gray-900">{selectedVehicle.name}</p>
              {(selectedVehicle.make || selectedVehicle.model || selectedVehicle.year) && (
                <p className="text-sm text-gray-500">
                  {[selectedVehicle.year, selectedVehicle.make, selectedVehicle.model].filter(Boolean).join(' ')}
                </p>
              )}
            </div>

            {selectedVehicle.currentMileage && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Current mileage</p>
                <p className="text-lg font-bold text-gray-900">{selectedVehicle.currentMileage.toLocaleString()} miles</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="currentMileage" className="block text-sm font-medium text-gray-700 mb-2">
                  New Odometer Reading
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="currentMileage"
                    value={mileageInput}
                    onChange={(e) => setMileageInput(e.target.value)}
                    className="block w-full px-4 py-3 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 50000"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    miles
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  💡 Enter your current odometer reading
                </p>
              </div>

              {selectedVehicle.oilChanges.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  <p className="text-gray-700">
                    Last service: <span className="font-medium">{selectedVehicle.oilChanges[0].mileageAtChange.toLocaleString()} mi</span>
                  </p>
                  <p className="text-gray-700 mt-1">
                    Next due: <span className="font-medium">{selectedVehicle.oilChanges[0].nextChangeDueAt.toLocaleString()} mi</span>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVehicle(null)
                    setMileageInput("")
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateMileage}
                  disabled={isLoading || !mileageInput}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Adding..." : "Add Mileage"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <NotificationPrompt />
    </div>
  )
}
