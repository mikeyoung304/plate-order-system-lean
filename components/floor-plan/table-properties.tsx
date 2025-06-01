'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronRight, Copy, Layers, Settings, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Table } from '@/lib/floor-plan-utils'

interface TablePropertiesProps {
  selectedTable: Table | null
  isOpen: boolean
  onToggle: (open: boolean) => void
  onUpdateTable: (property: keyof Table, value: any) => void
  onDeleteTable: () => void
  onDuplicateTable: () => void
  onBringToFront: () => void
  onSendToBack: () => void
}

export function TableProperties({
  selectedTable,
  isOpen,
  onToggle,
  onUpdateTable,
  onDeleteTable,
  onDuplicateTable,
  onBringToFront,
  onSendToBack,
}: TablePropertiesProps) {
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'available':
        return (
          <Badge className='bg-emerald-500/20 text-emerald-400 border-emerald-500/30'>
            Available
          </Badge>
        )
      case 'occupied':
        return (
          <Badge className='bg-red-500/20 text-red-400 border-red-500/30'>
            Occupied
          </Badge>
        )
      case 'reserved':
        return (
          <Badge className='bg-amber-500/20 text-amber-400 border-amber-500/30'>
            Reserved
          </Badge>
        )
      default:
        return (
          <Badge className='bg-gray-500/20 text-gray-400 border-gray-500/30'>
            Unknown
          </Badge>
        )
    }
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      className='bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden shadow-lg'
    >
      <CollapsibleTrigger asChild>
        <div className='flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50'>
          <div className='flex items-center gap-2'>
            <Settings className='h-5 w-5 text-gray-400' />
            <h3 className='text-lg font-medium'>Table Properties</h3>
          </div>
          <ChevronRight
            className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className='p-4 border-t border-gray-800'>
          {selectedTable ? (
            <div className='space-y-4'>
              {/* Table Label */}
              <div className='space-y-2'>
                <Label htmlFor='table-label'>Table Label</Label>
                <Input
                  id='table-label'
                  value={selectedTable.label}
                  onChange={e => onUpdateTable('label', e.target.value)}
                  placeholder='Enter table name'
                  className='bg-gray-800 border-gray-700'
                />
              </div>

              {/* Number of Seats */}
              <div className='space-y-2'>
                <Label htmlFor='table-seats'>
                  Seats ({selectedTable.seats})
                </Label>
                <Slider
                  id='table-seats'
                  value={[selectedTable.seats]}
                  onValueChange={value => onUpdateTable('seats', value[0])}
                  min={1}
                  max={12}
                  step={1}
                  className='w-full'
                />
              </div>

              {/* Table Status */}
              <div className='space-y-2'>
                <Label htmlFor='table-status'>Status</Label>
                <div className='flex items-center gap-2'>
                  <Select
                    value={selectedTable.status || 'available'}
                    onValueChange={value => onUpdateTable('status', value)}
                  >
                    <SelectTrigger className='bg-gray-800 border-gray-700'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='available'>Available</SelectItem>
                      <SelectItem value='occupied'>Occupied</SelectItem>
                      <SelectItem value='reserved'>Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                  {getStatusBadge(selectedTable.status)}
                </div>
              </div>

              {/* Dimensions */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='table-width'>Width</Label>
                  <Input
                    id='table-width'
                    type='number'
                    value={Math.round(selectedTable.width)}
                    onChange={e =>
                      onUpdateTable('width', parseInt(e.target.value) || 0)
                    }
                    min={20}
                    max={500}
                    className='bg-gray-800 border-gray-700'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='table-height'>Height</Label>
                  <Input
                    id='table-height'
                    type='number'
                    value={Math.round(selectedTable.height)}
                    onChange={e =>
                      onUpdateTable('height', parseInt(e.target.value) || 0)
                    }
                    min={20}
                    max={500}
                    className='bg-gray-800 border-gray-700'
                    disabled={selectedTable.type === 'circle'}
                  />
                </div>
              </div>

              {/* Position */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='table-x'>X Position</Label>
                  <Input
                    id='table-x'
                    type='number'
                    value={Math.round(selectedTable.x)}
                    onChange={e =>
                      onUpdateTable('x', parseInt(e.target.value) || 0)
                    }
                    className='bg-gray-800 border-gray-700'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='table-y'>Y Position</Label>
                  <Input
                    id='table-y'
                    type='number'
                    value={Math.round(selectedTable.y)}
                    onChange={e =>
                      onUpdateTable('y', parseInt(e.target.value) || 0)
                    }
                    className='bg-gray-800 border-gray-700'
                  />
                </div>
              </div>

              {/* Rotation */}
              <div className='space-y-2'>
                <Label htmlFor='table-rotation'>
                  Rotation ({Math.round(selectedTable.rotation || 0)}°)
                </Label>
                <Slider
                  id='table-rotation'
                  value={[selectedTable.rotation || 0]}
                  onValueChange={value => onUpdateTable('rotation', value[0])}
                  min={0}
                  max={360}
                  step={15}
                  className='w-full'
                />
              </div>

              {/* Table Type */}
              <div className='space-y-2'>
                <Label htmlFor='table-type'>Table Type</Label>
                <Select
                  value={selectedTable.type}
                  onValueChange={value => onUpdateTable('type', value)}
                >
                  <SelectTrigger className='bg-gray-800 border-gray-700'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='circle'>Circle</SelectItem>
                    <SelectItem value='square'>Square</SelectItem>
                    <SelectItem value='rectangle'>Rectangle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className='flex flex-wrap gap-2 pt-4 border-t border-gray-800'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={onDuplicateTable}
                  className='flex-1 min-w-0'
                >
                  <Copy className='h-4 w-4 mr-1' />
                  Duplicate
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={onBringToFront}
                  className='flex-1 min-w-0'
                >
                  <Layers className='h-4 w-4 mr-1' />
                  To Front
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={onSendToBack}
                  className='flex-1 min-w-0'
                >
                  <Layers className='h-4 w-4 mr-1' />
                  To Back
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={onDeleteTable}
                  className='flex-1 min-w-0'
                >
                  <Trash2 className='h-4 w-4 mr-1' />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className='text-center py-6 text-gray-400'>
              <Settings className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <h4 className='text-lg font-medium mb-2'>No Table Selected</h4>
              <p className='text-sm'>
                Click on a table to view and edit its properties
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
