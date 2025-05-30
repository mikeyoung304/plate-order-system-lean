"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { User, Clock, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  getSeatResidentSuggestions, 
  getTimeBasedResidentSuggestions 
} from '@/lib/modassembly/supabase/database/suggestions'
import { getAllResidents, type User as Resident } from '@/lib/modassembly/supabase/database/users'

interface SimpleResidentSelectorProps {
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
  reason: string
}

export function SimpleResidentSelector({
  tableId,
  tableName,
  seatNumber,
  onResidentSelected,
  onCancel,
  className = ''
}: SimpleResidentSelectorProps) {
  const [recentResidents, setRecentResidents] = useState<ResidentSuggestion[]>([])
  const [allResidents, setAllResidents] = useState<Resident[]>([])
  const [selectedResident, setSelectedResident] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  
  const { toast } = useToast()

  // Load suggestions and residents
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load recent residents for this seat
        const seatSuggestions = await getSeatResidentSuggestions(tableId, seatNumber, 3)
        const recentSeatResidents = seatSuggestions.map(sug => ({
          resident_id: sug.resident_id,
          name: sug.name,
          reason: `Usually sits here`
        }))
        
        // Load residents who typically dine at this time
        const currentHour = new Date().getHours()
        const timeSuggestions = await getTimeBasedResidentSuggestions(currentHour, 2)
        const recentTimeResidents = timeSuggestions
          .filter(sug => !recentSeatResidents.some(r => r.resident_id === sug.resident_id))
          .map(sug => ({
            resident_id: sug.resident_id,
            name: sug.name,
            reason: `Often dines now`
          }))
        
        setRecentResidents([...recentSeatResidents, ...recentTimeResidents])
        
        // Load all residents for manual selection
        const residents = await getAllResidents()
        setAllResidents(residents)
        
      } catch (error) {
        console.error('Error loading residents:', error)
        toast({
          title: 'Loading Error',
          description: 'Could not load resident information.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [tableId, seatNumber, toast])

  const handleResidentSelect = useCallback((residentId: string) => {
    const resident = allResidents.find(r => r.id === residentId)
    if (resident) {
      onResidentSelected(residentId, resident.name)
    }
  }, [allResidents, onResidentSelected])

  if (isLoading) {
    return (
      <Card className={`max-w-md mx-auto ${className}`}>
        <CardContent className="p-6">
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading residents...</p>
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
          {tableName} - Seat {seatNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Recent residents for this seat/time */}
        {recentResidents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Recent residents</span>
            </div>
            
            {recentResidents.map((resident) => (
              <Button
                key={resident.resident_id}
                variant="outline"
                className="w-full p-3 h-auto flex items-center justify-between hover:bg-primary/5"
                onClick={() => handleResidentSelect(resident.resident_id)}
              >
                <span className="font-medium">{resident.name}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {resident.reason.includes('sits') ? (
                    <MapPin className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  {resident.reason}
                </span>
              </Button>
            ))}
          </div>
        )}

        {/* Manual selection */}
        <div className="space-y-3">
          <Separator />
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Choose any resident</span>
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
        </div>
      </CardContent>
    </Card>
  )
}