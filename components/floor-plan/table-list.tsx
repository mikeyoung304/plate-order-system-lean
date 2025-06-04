'use client'

import { memo, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Table } from '@/lib/floor-plan-utils'

interface TableListProps {
  tables: Table[]
  selectedTable: Table | null
  onSelectTable: (table: Table) => void
}

// Memoized table row component for better performance
const TableRow = memo(({ 
  table, 
  isSelected, 
  onSelect 
}: { 
  table: Table
  isSelected: boolean
  onSelect: (table: Table) => void 
}) => {
  const getStatusBadge = useCallback((status: string | undefined) => {
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
  }, [])

  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'circle':
        return '⭕'
      case 'square':
        return '⬜'
      case 'rectangle':
        return '▬'
      default:
        return '⬜'
    }
  }, [])

  const handleClick = useCallback(() => {
    onSelect(table)
  }, [table, onSelect])

  return (
    <div
      className={cn(
        'p-3 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors',
        isSelected && 'bg-blue-900/20 border-r-2 border-blue-500'
      )}
      onClick={handleClick}
    >
      <div className='flex items-center gap-3 min-w-0 flex-1'>
        <span className='text-lg' title={`${table.type} table`}>
          {getTypeIcon(table.type)}
        </span>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <h4 className='text-sm font-medium truncate'>
              {table.label}
            </h4>
            <span className='text-xs text-gray-400 flex-shrink-0'>
              {table.seats} seats
            </span>
          </div>

          <div className='flex items-center gap-2 mt-1'>
            <span className='text-xs text-gray-500'>
              {Math.round(table.width)}×{Math.round(table.height)}
            </span>

            {table.rotation && table.rotation !== 0 && (
              <span className='text-xs text-gray-500'>
                {Math.round(table.rotation)}°
              </span>
            )}
          </div>
        </div>
      </div>

      <div className='flex-shrink-0'>
        {getStatusBadge(table.status)}
      </div>
    </div>
  )
})
TableRow.displayName = 'TableRow'

export const TableList = memo(function TableList({
  tables,
  selectedTable,
  onSelectTable,
}: TableListProps) {

  return (
    <Card className='bg-gray-900/50 border-gray-800 shadow-lg'>
      <div className='p-4 border-b border-gray-800'>
        <h3 className='text-lg font-medium'>Tables ({tables.length})</h3>
      </div>

      <CardContent className='p-0 max-h-[300px] overflow-y-auto'>
        {tables.length > 0 ? (
          <div className='divide-y divide-gray-800'>
            {tables.map(table => (
              <TableRow
                key={table.id}
                table={table}
                isSelected={selectedTable?.id === table.id}
                onSelect={onSelectTable}
              />
            ))}
          </div>
        ) : (
          <div className='p-6 text-center text-gray-400'>
            <div className='text-4xl mb-4'>🍽️</div>
            <h4 className='text-lg font-medium mb-2'>No Tables</h4>
            <p className='text-sm'>
              Click the toolbar buttons above to add tables to your floor plan
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

TableList.displayName = 'TableList'
