// OVERNIGHT_SESSION: 2025-05-30 - Intelligent resident recognition component
// Reason: Smart resident selection using seating patterns and dining habits
// Impact: Dramatically faster order taking with accurate resident suggestions

"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { User, Clock, MapPin, Star, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { 
  getSeatResidentSuggestions, 
  getTimeBasedResidentSuggestions 
} from '@/lib/modassembly/supabase/database/suggestions'
import { getAllResidents, type User as Resident } from '@/lib/modassembly/supabase/database/users'
import { useRenderPerformance } from '@/lib/performance/monitoring'

interface IntelligentResidentSelectorProps {
  tableId: string
  tableName: string
  seatNumber: number
  onResidentSelected: (residentId: string, residentName: string) => void
  onCancel: () => void
  className?: string
}

interface ResidentSuggestion {
  resident_id: string
  name: string
  confidence: number
  reason: 'seat_pattern' | 'time_pattern' | 'manual'
  details?: string
}

export function IntelligentResidentSelector({
  tableId,
  tableName,
  seatNumber,
  onResidentSelected,
  onCancel,
  className = ''
}: IntelligentResidentSelectorProps) {
  // Performance monitoring
  useRenderPerformance('IntelligentResidentSelector')

  const [seatSuggestions, setSeatSuggestions] = useState<ResidentSuggestion[]>([])
  const [timeSuggestions, setTimeSuggestions] = useState<ResidentSuggestion[]>([])
  const [allResidents, setAllResidents] = useState<Resident[]>([])
  const [selectedResident, setSelectedResident] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStep, setLoadingStep] = useState('Analyzing seating patterns...')
  
  const { toast } = useToast()

  // Get current hour for time-based suggestions
  const currentHour = new Date().getHours()

  // Load all suggestion data
  useEffect(() => {
    let mounted = true

    const loadSuggestions = async () => {
      try {
        setLoadingStep('Analyzing seating patterns...')
        
        // Load seat-based suggestions
        const seatSugs = await getSeatResidentSuggestions(tableId, seatNumber, 3)
        if (!mounted) return
        
        setSeatSuggestions(seatSugs.map(sug => ({
          resident_id: sug.resident_id,
          name: sug.name,
          confidence: sug.confidence,
          reason: 'seat_pattern' as const,
          details: `Usually sits here (${sug.confidence}% confidence)`
        })))

        setLoadingStep('Analyzing dining patterns...')
        
        // Load time-based suggestions
        const timeSugs = await getTimeBasedResidentSuggestions(currentHour, 3)
        if (!mounted) return
        
        setTimeSuggestions(timeSugs.map(sug => ({
          resident_id: sug.resident_id,
          name: sug.name,
          confidence: sug.confidence,
          reason: 'time_pattern' as const,
          details: `Often dines at ${sug.typical_time} (${sug.confidence}% match)`
        })))

        setLoadingStep('Loading resident directory...')
        
        // Load all residents for manual selection
        const residents = await getAllResidents()
        if (!mounted) return
        
        setAllResidents(residents)
        
      } catch (error) {
        console.error('Error loading resident suggestions:', error)
        if (mounted) {
          toast({
            title: 'Loading Error',
            description: 'Could not load resident suggestions. Please try again.',
            variant: 'destructive'
          })
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadSuggestions()
    
    return () => {
      mounted = false
    }
  }, [tableId, seatNumber, currentHour, toast])

  // Combine and deduplicate suggestions with smart ranking
  const smartSuggestions = useMemo(() => {
    const suggestionMap = new Map<string, ResidentSuggestion>()
    
    // Add seat suggestions with priority
    seatSuggestions.forEach(sug => {
      suggestionMap.set(sug.resident_id, {
        ...sug,
        confidence: sug.confidence + 10 // Boost seat pattern confidence
      })
    })
    
    // Add time suggestions, merging with existing
    timeSuggestions.forEach(sug => {
      const existing = suggestionMap.get(sug.resident_id)
      if (existing) {
        // Resident appears in both seat and time patterns - very high confidence
        suggestionMap.set(sug.resident_id, {
          ...existing,
          confidence: Math.min(95, existing.confidence + sug.confidence),
          details: `Perfect match: usual seat AND dining time`
        })
      } else {
        suggestionMap.set(sug.resident_id, sug)
      }
    })
    
    return Array.from(suggestionMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5) // Top 5 suggestions
  }, [seatSuggestions, timeSuggestions])

  const handleResidentSelect = useCallback((residentId: string) => {
    const resident = allResidents.find(r => r.id === residentId)
    if (resident) {
      onResidentSelected(residentId, resident.name)
    }
  }, [allResidents, onResidentSelected])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (confidence >= 60) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (confidence >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'seat_pattern': return <MapPin className="h-3 w-3" />
      case 'time_pattern': return <Clock className="h-3 w-3" />
      default: return <User className="h-3 w-3" />
    }
  }

  if (isLoading) {
    return (
      <Card className={`max-w-md mx-auto ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 animate-pulse" />
            Smart Recognition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
            <p className="mt-3 text-sm text-muted-foreground">{loadingStep}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Who's sitting at {tableName} - Seat {seatNumber}?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Smart Suggestions</span>
            </div>
            
            <AnimatePresence>
              {smartSuggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.resident_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    variant="outline"
                    className="w-full p-4 h-auto flex flex-col items-start gap-2 hover:bg-primary/5"
                    onClick={() => handleResidentSelect(suggestion.resident_id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{suggestion.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}
                      >
                        {suggestion.confidence}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getReasonIcon(suggestion.reason)}
                      <span>{suggestion.details}</span>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Manual Selection */}
        <div className="space-y-3">
          <Separator />
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Or choose manually</span>
          </div>
          
          <Select value={selectedResident} onValueChange={setSelectedResident}>
            <SelectTrigger>
              <SelectValue placeholder="Search all residents..." />
            </SelectTrigger>
            <SelectContent>
              {allResidents.map(resident => (
                <SelectItem key={resident.id} value={resident.id}>
                  {resident.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedResident && (
            <Button 
              className="w-full"
              onClick={() => handleResidentSelect(selectedResident)}
            >
              Select Resident
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          {smartSuggestions.length === 0 && !selectedResident && (
            <Button variant="outline" className="flex-1" disabled>
              No suggestions available
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}