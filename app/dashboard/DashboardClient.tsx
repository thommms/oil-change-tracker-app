"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Logo from "@/components/Logo"
import Image from "next/image"

type OilChange = {
  id: string
  mileageAtChange: number
  dateOfChange: Date
  nextChangeDueAt: number
  nextChangeDueDate: Date
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
  imageUrl: string | null
  currentMileage: number | null
  oilChangeInterval: number
  oilChangeIntervalMonths: number
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
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "needService" | "good">("all")

  const getServiceStatus = (vehicle: Vehicle) => {
    const lastChange = vehicle.oilChanges[0]
    if (!lastChange) return null

    const milesUntilNext = vehicle.currentMileage
      ? lastChange.nextChangeDueAt - vehicle.currentMileage
      : null

    const nextDueDate = new Date(lastChange.nextChangeDueDate)
    const now = new Date()
    const daysUntilDue = Math.floor((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const needsServiceByMileage = milesUntilNext !== null && milesUntilNext <= 200
    const needsServiceByTime = daysUntilDue <= 14

    const isOverdueByMileage = milesUntilNext !== null && milesUntilNext < 0
    const isOverdueByTime = daysUntilDue < 0

    return {
      milesUntilNext,
      daysUntilDue,
      nextDueDate,
      needsService: needsServiceByMileage || needsServiceByTime,
      isOverdue: isOverdueByMileage || isOverdueByTime,
    }
  }

  const vehiclesNeedingService = vehicles.filter(vehicle => {
    const status = getServiceStatus(vehicle)
    return status && status.needsService
  })

  const vehiclesAllGood = vehicles.filter(vehicle => {
    const status = getServiceStatus(vehicle)
    return status && !status.needsService
  })

  // Filter vehicles based on selected filter
  const filteredVehicles = filter === "all" 
    ? vehicles 
    : filter === "needService" 
      ? vehiclesNeedingService 
      : vehiclesAllGood

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

  const handleDeleteMileageHistory = async (historyId: string, mileage: number) => {
    if (!confirm(`Delete mileage entry: ${mileage.toLocaleString()} miles?`)) {
      return
    }

    setDeletingHistoryId(historyId)
    try {
      const response = await fetch("/api/mileage-history/" + historyId, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete mileage history")
      }

      router.refresh()
    } catch (error) {
      alert("Failed to delete mileage history")
    } finally {
      setDeletingHistoryId(null)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">👋 {session.user.name || session.user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm text-red-600 hover:text-red-700 font-medium">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - NOW CLICKABLE! */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={`bg-white rounded-xl shadow-md p-6 border-2 hover:shadow-lg transition-all text-left ${
              filter === "all" ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-100"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                🚗
              </div>
              <h3 className="text-sm font-medium text-gray-500">Total Vehicles</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{vehicles.length}</p>
            {filter === "all" && <p className="text-xs text-blue-600 mt-2 font-medium">Currently viewing</p>}
          </button>
          
          <button
            onClick={() => setFilter("needService")}
            className={`bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 border-2 hover:shadow-lg transition-all text-left ${
              filter === "needService" ? "border-yellow-500 ring-2 ring-yellow-200" : "border-yellow-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">
                ⚠️
              </div>
              <h3 className="text-sm font-medium text-yellow-800">Need Service Soon</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-900">{vehiclesNeedingService.length}</p>
            {filter === "needService" && <p className="text-xs text-yellow-600 mt-2 font-medium">Currently viewing</p>}
          </button>
          
          <button
            onClick={() => setFilter("good")}
            className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-6 border-2 hover:shadow-lg transition-all text-left ${
              filter === "good" ? "border-green-500 ring-2 ring-green-200" : "border-green-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
                ✓
              </div>
              <h3 className="text-sm font-medium text-green-800">All Good</h3>
            </div>
            <p className="text-3xl font-bold text-green-900">{vehiclesAllGood.length}</p>
            {filter === "good" && <p className="text-xs text-green-600 mt-2 font-medium">Currently viewing</p>}
          </button>
        </div>

        {/* Vehicles Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🚙 Your Vehicles
              {filter !== "all" && (
                <span className="text-sm font-normal text-gray-500">
                  ({filteredVehicles.length} {filter === "needService" ? "need service" : "all good"})
                </span>
              )}
            </h2>
            <a href="/dashboard/vehicles/new" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm font-medium shadow-sm hover:shadow-md transition-all">
              + Add Vehicle
            </a>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-6xl mb-4">
                {filter === "needService" ? "✓" : filter === "good" ? "⚠️" : "🚗"}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {filter === "needService" 
                  ? "No vehicles need service!" 
                  : filter === "good" 
                    ? "No vehicles are in good condition" 
                    : "No vehicles yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === "all" 
                  ? "Get started by adding your first vehicle to track oil changes"
                  : <button onClick={() => setFilter("all")} className="text-blue-600 hover:text-blue-700 font-medium">View all vehicles</button>
                }
              </p>
              {filter === "all" && (
                <a href="/dashboard/vehicles/new" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all">
                  + Add Your First Vehicle
                </a>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredVehicles.map((vehicle) => {
                const status = getServiceStatus(vehicle)
                const isExpanded = expandedVehicle === vehicle.id

                return (
                  <div key={vehicle.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Vehicle Image */}
                      <div className="flex-shrink-0">
                        {vehicle.imageUrl ? (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                            <Image 
                              src={vehicle.imageUrl} 
                              alt={vehicle.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs text-center p-2">
                            No image
                          </div>
                        )}
                      </div>

                      {/* Vehicle Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{vehicle.name}</h3>
                            {(vehicle.make || vehicle.model || vehicle.year) && (
                              <p className="text-sm text-gray-500">
                                {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                              </p>
                            )}
                          </div>
                          {status && status.isOverdue && (
                            <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full animate-pulse">
                              🚨 Overdue!
                            </span>
                          )}
                          {status && status.needsService && !status.isOverdue && (
                            <span className="px-3 py-1 text-xs font-bold bg-yellow-100 text-yellow-800 rounded-full">
                              ⚠️ Service Soon
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          <button
                            onClick={() => openMileageModal(vehicle)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all"
                          >
                            <span className="text-lg">+</span>
                            Add Mileage
                          </button>

                          {vehicle.mileageHistory.length > 0 && (
                            <button
                              onClick={() => toggleExpanded(vehicle.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              {isExpanded ? '📖 Hide' : '📋 Show'} History ({vehicle.mileageHistory.length})
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
                          <div className="mt-4 space-y-2 bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                              📊 Mileage History
                            </h4>
                            {vehicle.mileageHistory.map((history, index) => (
                              <div 
                                key={history.id} 
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                  index === 0 ? 'bg-blue-50 border-2 border-blue-200' : 'bg-white border border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-xl">⚡</div>
                                  <div>
                                    <span className="font-bold text-gray-900">
                                      {history.mileage.toLocaleString()} miles
                                    </span>
                                    {index === 0 && (
                                      <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded">
                                        CURRENT
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500">
                                    {new Date(history.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteMileageHistory(history.id, history.mileage)}
                                    disabled={deletingHistoryId === history.id}
                                    className="text-red-600 hover:text-red-700 disabled:opacity-50 p-1"
                                    title="Delete this entry"
                                  >
                                    {deletingHistoryId === history.id ? (
                                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {vehicle.oilChanges.length > 0 && status && (
                          <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
                            <span className="text-gray-600">Last service: <strong>{vehicle.oilChanges[0].mileageAtChange.toLocaleString()} mi</strong></span>
                            
                            {status.milesUntilNext !== null && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className={`font-bold ${
                                  status.isOverdue ? 'text-red-600' : 
                                  status.needsService ? 'text-yellow-600' : 
                                  'text-green-600'
                                }`}>
                                  {status.milesUntilNext > 0 
                                    ? `${status.milesUntilNext.toLocaleString()} mi until service` 
                                    : `${Math.abs(status.milesUntilNext).toLocaleString()} mi overdue!`}
                                </span>
                              </>
                            )}

                            <span className="text-gray-300">•</span>
                            <span className={`font-bold ${
                              status.isOverdue ? 'text-red-600' : 
                              status.needsService ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {status.daysUntilDue > 0 
                                ? `${status.daysUntilDue} days until due` 
                                : `${Math.abs(status.daysUntilDue)} days overdue!`}
                            </span>
                            
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-600">
                              Due: {status.nextDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <a href={"/dashboard/vehicles/" + vehicle.id} className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap hover:underline">
                          View Details →
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

      {/* Mileage Modal - same as before */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Add Current Mileage
              </h3>
              <button
                onClick={() => {
                  setSelectedVehicle(null)
                  setMileageInput("")
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <p className="font-bold text-gray-900 flex items-center gap-2">
                <span className="text-xl">🚗</span>
                {selectedVehicle.name}
              </p>
              {(selectedVehicle.make || selectedVehicle.model || selectedVehicle.year) && (
                <p className="text-sm text-gray-500 ml-7">
                  {[selectedVehicle.year, selectedVehicle.make, selectedVehicle.model].filter(Boolean).join(' ')}
                </p>
              )}
            </div>

            {selectedVehicle.currentMileage && (
              <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Current mileage</p>
                <p className="text-2xl font-bold text-blue-900">{selectedVehicle.currentMileage.toLocaleString()} miles</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="currentMileage" className="block text-sm font-bold text-gray-700 mb-2">
                  New Odometer Reading
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="currentMileage"
                    value={mileageInput}
                    onChange={(e) => setMileageInput(e.target.value)}
                    className="block w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 50000"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                    miles
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  💡 Enter your current odometer reading
                </p>
              </div>

              {selectedVehicle.oilChanges.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm">
                  <p className="text-gray-700">
                    Last service: <span className="font-bold">{selectedVehicle.oilChanges[0].mileageAtChange.toLocaleString()} mi</span>
                  </p>
                  <p className="text-gray-700 mt-1">
                    Next due: <span className="font-bold">{selectedVehicle.oilChanges[0].nextChangeDueAt.toLocaleString()} mi</span>
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
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateMileage}
                  disabled={isLoading || !mileageInput}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                >
                  {isLoading ? "Adding..." : "Add Mileage"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
