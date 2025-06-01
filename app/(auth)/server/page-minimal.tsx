/**
 * MINIMAL SERVER VIEW - Sexy and Sleek
 * 
 * This is the clean, intuitive server interface you requested.
 * No clutter, no legend, no instructions - just a beautiful overhead
 * view of the dining room that's immediately obvious what to do.
 * 
 * Design Philosophy:
 * - Tap a table to order
 * - That's it. Nothing else needed.
 * - Beautiful, minimal, intuitive
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from "framer-motion"

import { EnhancedProtectedRoute as ProtectedRoute } from "@/lib/modassembly/supabase/auth/enhanced-protected-route"
import { useToast } from "@/hooks/use-toast"
import { Table } from "@/lib/floor-plan-utils"

// Dynamic imports for heavy components
const FloorPlanViewSimple = dynamic(() => 
  import('@/components/floor-plan-view-simple').then(m => ({ default: m.FloorPlanViewSimple })), 
  { 
    loading: () => <div className="h-full w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
    ssr: false
  }
)

const QuickOrderModalSimple = dynamic(() => 
  import('@/components/quick-order-modal-simple').then(m => ({ default: m.QuickOrderModalSimple })), 
  { 
    loading: () => null,
    ssr: false
  }
)

import { createOrder } from "@/lib/modassembly/supabase/database/orders"
import { fetchSeatId } from "@/lib/modassembly/supabase/database/seats"
import { useServerPageData } from "@/lib/hooks/use-server-page-data"
import { useFloorPlanDemo } from "@/hooks/use-floor-plan-demo"
import { isDemo } from "@/lib/modassembly/supabase/auth/roles"

export default function MinimalServerPage() {
  const { toast } = useToast()
  const data = useServerPageData("default")
  
  // Demo mode detection and floor plan management
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoFloorPlan] = useFloorPlanDemo("demo")
  
  // Quick Order Modal state (minimal)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null)
  
  const showOrderModal = selectedTable && selectedSeat

  // Check demo mode on mount
  useEffect(() => {
    const checkDemo = async () => {
      const demo = await isDemo()
      setIsDemoMode(demo)
    }
    checkDemo()
  }, [])

  // Get the right tables based on mode
  const tables = isDemoMode ? demoFloorPlan.tables : data.tables

  // Handle table selection - immediately intuitive
  const handleTableSelect = useCallback((table: Table) => {
    setSelectedTable(table)
    
    // If table has only 1 seat, skip seat selection
    if (table.seats === 1) {
      setSelectedSeat(1)
    } else {
      // For multi-seat tables, we'll show seat picker in modal
      setSelectedSeat(null)
    }
    
    // Subtle haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(30)
  }, [])

  // Handle seat selection in modal
  const handleSeatSelect = useCallback((seatNumber: number) => {
    setSelectedSeat(seatNumber)
  }, [])

  // Handle order placement
  const handleOrderPlaced = useCallback(async (orderData: {
    tableId: string
    seatNumber: number
    residentId: string
    items: string[]
    type: 'food' | 'drink'
    isSpecial?: boolean
    specialId?: string
  }) => {
    try {
      // Skip database operations in demo mode
      if (!isDemoMode) {
        const seatId = await fetchSeatId(orderData.tableId, orderData.seatNumber)
        
        if (!seatId) {
          toast({ 
            title: "Error", 
            description: "Invalid seat selection.", 
            variant: "destructive" 
          })
          return
        }

        await createOrder({
          table_id: orderData.tableId,
          seat_id: seatId,
          resident_id: orderData.residentId,
          server_id: data.user?.id!,
          items: orderData.items,
          transcript: orderData.isSpecial ? `Special: ${orderData.items.join(', ')}` : orderData.items.join(', '),
          type: orderData.type,
          special_id: orderData.specialId
        })

        await data.refreshRecentOrders()
      }

      // Success feedback
      toast({
        title: isDemoMode ? "Demo Order Placed! 🎉" : "Order Placed! 🎉",
        description: `${orderData.isSpecial ? "Today's special" : orderData.items.join(', ')} ${isDemoMode ? '(Demo Mode)' : `for Table ${selectedTable?.label}, Seat ${orderData.seatNumber}`}`,
        duration: 3000
      })

      // Close modal
      setSelectedTable(null)
      setSelectedSeat(null)

    } catch (error) {
      console.error('Order submission error:', error)
      toast({ 
        title: 'Order Failed', 
        description: 'Could not place order. Please try again.', 
        variant: 'destructive' 
      })
    }
  }, [isDemoMode, selectedTable, data, toast])

  // Handle voice order flow
  const handleShowVoicePanel = useCallback(() => {
    // For now, just show a coming soon message
    toast({
      title: "Voice Ordering",
      description: "Voice ordering will open in a new flow",
      duration: 2000
    })
    setSelectedTable(null)
    setSelectedSeat(null)
  }, [toast])

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setSelectedTable(null)
    setSelectedSeat(null)
  }, [])

  return (
    <ProtectedRoute roles={["server", "demo"]}>
      {/* Full Screen Floor Plan - Nothing else */}
      <div className="fixed inset-0 bg-gray-900">
        
        {/* Demo Mode Indicator */}
        {isDemoMode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 z-10"
          >
            <div className="bg-blue-600/90 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium">
              Demo Mode
            </div>
          </motion.div>
        )}

        {/* The Floor Plan - Full Screen Beauty */}
        <div className="h-full w-full">
          <AnimatePresence>
            <motion.div
              key="floor-plan"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full w-full"
            >
              {data.loading && !isDemoMode ? (
                <div className="h-full w-full flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <FloorPlanViewSimple 
                  onSelectTable={handleTableSelect}
                  tables={tables}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Quick Order Modal - Appears when table selected */}
        <QuickOrderModalSimple
          table={selectedTable}
          seatNumber={selectedSeat}
          onClose={handleModalClose}
          onOrderPlaced={handleOrderPlaced}
          onShowVoicePanel={handleShowVoicePanel}
          onSeatSelect={selectedTable && selectedTable.seats > 1 ? handleSeatSelect : undefined}
        />

      </div>
    </ProtectedRoute>
  )
}

/**
 * DESIGN NOTES:
 * 
 * This is the "sexy and sleek" server view you requested:
 * 
 * ✅ WHAT IT IS:
 * - Full screen floor plan view
 * - Tap a table → instant order modal
 * - No clutter, no legend, no instructions
 * - Intuitive from the moment you open it
 * - Demo mode with temporary data
 * 
 * ✅ WHAT IT'S NOT:
 * - No complex navigation
 * - No sidebar panels
 * - No step-by-step wizards
 * - No overwhelming UI elements
 * 
 * ✅ USER EXPERIENCE:
 * 1. Open app → see dining room layout
 * 2. Tap table → order modal appears
 * 3. Place order → back to floor plan
 * 4. That's it. Perfect simplicity.
 * 
 * ✅ DEMO MODE:
 * - Demo users get full floor plan editing
 * - All data stored in session storage
 * - Resets when browser closes
 * - No database pollution
 */