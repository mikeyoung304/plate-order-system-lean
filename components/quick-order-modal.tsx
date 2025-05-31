"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Clock, AlertTriangle, Mic } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table } from "@/lib/floor-plan-utils"
import { getSeatResidentSuggestions } from "@/lib/modassembly/supabase/database/suggestions"

type SeatSuggestion = {
  resident: {
    id: string
    name: string
    photo_url?: string
    dietary_restrictions?: string
  }
  confidence: number
  isPrimary: boolean
  usualOrder?: string
}

type DailySpecial = {
  description: string
  mealPeriod: string
}

type QuickOrderModalProps = {
  table: Table | null
  seatNumber: number | null
  onClose: () => void
  onOrderPlaced: (orderData: {
    tableId: string
    seatNumber: number
    residentId: string
    items: string[]
    type: 'food' | 'drink'
    isSpecial?: boolean
  }) => void
  onShowVoicePanel: () => void
}

// Real API call using smart seat memory algorithm
const getSeatSuggestions = async (tableId: string, seatNumber: number): Promise<SeatSuggestion[]> => {
  return await getSeatResidentSuggestions(tableId, seatNumber, 3)
}

const getTodaysSpecial = (): DailySpecial => {
  // In real app, this would check current time and fetch from database
  const currentHour = new Date().getHours()
  
  if (currentHour < 11) {
    return { description: "Pancakes with Fresh Berries", mealPeriod: "breakfast" }
  } else if (currentHour < 16) {
    return { description: "Meatloaf & Mashed Potatoes", mealPeriod: "lunch" }
  } else {
    return { description: "Herb-Crusted Salmon", mealPeriod: "dinner" }
  }
}

export function QuickOrderModal({ 
  table, 
  seatNumber, 
  onClose, 
  onOrderPlaced, 
  onShowVoicePanel 
}: QuickOrderModalProps) {
  const [seatSuggestions, setSeatSuggestions] = useState<SeatSuggestion[]>([])
  const [selectedResident, setSelectedResident] = useState<SeatSuggestion | null>(null)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showResidentSearch, setShowResidentSearch] = useState(false)
  const [todaysSpecial] = useState(getTodaysSpecial())

  // Load seat suggestions when modal opens
  useEffect(() => {
    if (table && seatNumber) {
      setIsLoadingSuggestions(true)
      getSeatSuggestions(table.id, seatNumber)
        .then(suggestions => {
          setSeatSuggestions(suggestions)
          // Auto-select primary suggestion if confidence > 80%
          if (suggestions.length > 0 && suggestions[0].isPrimary && suggestions[0].confidence > 80) {
            setSelectedResident(suggestions[0])
          }
        })
        .finally(() => setIsLoadingSuggestions(false))
    }
  }, [table, seatNumber])

  const confirmResident = (suggestion: SeatSuggestion) => {
    setSelectedResident(suggestion)
    setShowResidentSearch(false)
  }

  const orderSpecial = () => {
    if (!table || !seatNumber || !selectedResident) return
    
    onOrderPlaced({
      tableId: table.id,
      seatNumber,
      residentId: selectedResident.resident.id,
      items: [todaysSpecial.description],
      type: 'food',
      isSpecial: true
    })
  }

  const orderUsual = () => {
    if (!table || !seatNumber || !selectedResident || !selectedResident.usualOrder) return
    
    onOrderPlaced({
      tableId: table.id,
      seatNumber,
      residentId: selectedResident.resident.id,
      items: [selectedResident.usualOrder],
      type: 'food'
    })
  }

  if (!table || !seatNumber) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 h-9 w-9"
            onClick={onClose}
            aria-label="Close order modal"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Quick Order</h2>
            <p className="text-gray-600">Table {table.label}, Seat {seatNumber}</p>
          </div>

          {/* Resident Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Who is this for?</h3>
            
            {isLoadingSuggestions ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Finding usual resident...</span>
              </div>
            ) : selectedResident ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={selectedResident.resident.photo_url} />
                    <AvatarFallback>{selectedResident.resident.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="font-semibold text-gray-900">{selectedResident.resident.name}</h4>
                      <Check className="ml-2 h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">{selectedResident.confidence}% match for this seat</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedResident(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : seatSuggestions.length > 0 ? (
              <div className="space-y-2">
                {seatSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion.resident.id}
                    variant="outline"
                    className="w-full h-auto p-4 text-left justify-start"
                    onClick={() => confirmResident(suggestion)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={suggestion.resident.photo_url} />
                      <AvatarFallback>{suggestion.resident.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium">{suggestion.resident.name}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {suggestion.confidence}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">Usually sits here</p>
                    </div>
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowResidentSearch(true)}
                >
                  + Someone else
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-16"
                onClick={() => setShowResidentSearch(true)}
              >
                <div className="text-center">
                  <p className="font-medium">Select Resident</p>
                  <p className="text-sm text-gray-500">No usual resident for this seat</p>
                </div>
              </Button>
            )}
          </div>

          {/* Order Options - Only show if resident is selected */}
          {selectedResident && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">What would they like?</h3>
              
              {/* Today's Special - Primary CTA */}
              <Button
                size="lg"
                className="w-full h-24 text-xl bg-green-600 hover:bg-green-700 text-white relative overflow-hidden"
                onClick={orderSpecial}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-700/20"></div>
                <div className="relative flex flex-col items-center">
                  <div className="flex items-center mb-1">
                    <span className="text-2xl mr-2">🍽️</span>
                    <span className="font-bold">TODAY'S SPECIAL</span>
                  </div>
                  <div className="text-lg font-normal">{todaysSpecial.description}</div>
                </div>
              </Button>

              {/* Usual Order */}
              {selectedResident.usualOrder && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-16 text-lg border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                  onClick={orderUsual}
                >
                  <div className="flex items-center">
                    <Clock className="mr-3 h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-semibold">Their Usual</div>
                      <div className="text-sm text-gray-600">{selectedResident.usualOrder}</div>
                    </div>
                  </div>
                </Button>
              )}

              {/* Voice Order Option */}
              <Button
                size="lg"
                variant="ghost"
                className="w-full h-12 text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  onClose()
                  onShowVoicePanel()
                }}
              >
                <Mic className="mr-2 h-5 w-5" />
                Something Else (Voice Order)
              </Button>

              {/* Dietary Warnings */}
              {selectedResident.resident.dietary_restrictions && (
                <Alert className="mt-4 border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Dietary Alert:</strong> {selectedResident.resident.dietary_restrictions}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}