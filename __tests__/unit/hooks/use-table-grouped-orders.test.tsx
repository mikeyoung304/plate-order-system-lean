import { renderHook } from '@testing-library/react'
import { useTableGroupedOrders, useTableGroupTiming } from '@/hooks/use-table-grouped-orders'
import type { KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds'
import type { TableGroup } from '@/hooks/use-table-grouped-orders'

describe('useTableGroupedOrders', () => {
  const mockOrder = (id: string, tableId: string, tableLabel: string, overrides: Partial<KDSOrderRouting> = {}): KDSOrderRouting => ({
    id,
    order_id: `order-${id}`,
    station_id: 'station-1',
    priority: 5,
    routed_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    bumped_at: null,
    recall_count: 0,
    order: {
      id: `order-${id}`,
      order_number: parseInt(id),
      status: 'pending',
      created_at: new Date().toISOString(),
      items: [
        { id: `item-${id}-1`, name: 'Test Item 1', quantity: 1 },
        { id: `item-${id}-2`, name: 'Test Item 2', quantity: 2 }
      ],
      table: {
        id: tableId,
        label: tableLabel,
        capacity: 4
      },
      seat: {
        id: `seat-${id}`,
        number: 1,
        table_id: tableId
      }
    },
    ...overrides
  })

  describe('Basic Grouping Logic', () => {
    it('should group orders by table correctly', () => {
      const orders = [
        mockOrder('1', 'table-1', '5'),
        mockOrder('2', 'table-1', '5'),
        mockOrder('3', 'table-2', '8'),
        mockOrder('4', 'table-2', '8'),
        mockOrder('5', 'table-2', '8'),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))

      expect(result.current).toHaveLength(2)
      
      const table5Group = result.current.find(g => g.tableLabel === 'Table 5')
      const table8Group = result.current.find(g => g.tableLabel === 'Table 8')
      
      expect(table5Group?.orders).toHaveLength(2)
      expect(table8Group?.orders).toHaveLength(3)
    })

    it('should handle empty order list', () => {
      const { result } = renderHook(() => useTableGroupedOrders([]))
      expect(result.current).toEqual([])
    })

    it('should handle orders without table information', () => {
      const orderWithoutTable = {
        ...mockOrder('1', 'table-1', '5'),
        order: {
          ...mockOrder('1', 'table-1', '5').order,
          table: null
        }
      } as any

      const { result } = renderHook(() => useTableGroupedOrders([orderWithoutTable]))
      expect(result.current).toEqual([])
    })
  })

  describe('Order Sorting and Timing', () => {
    it('should sort orders by routed_at time within each group', () => {
      const now = new Date()
      const orders = [
        mockOrder('1', 'table-1', '5', { 
          routed_at: new Date(now.getTime() - 300000).toISOString() // 5 minutes ago
        }),
        mockOrder('2', 'table-1', '5', { 
          routed_at: new Date(now.getTime() - 600000).toISOString() // 10 minutes ago
        }),
        mockOrder('3', 'table-1', '5', { 
          routed_at: new Date(now.getTime() - 150000).toISOString() // 2.5 minutes ago
        }),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.orders).toHaveLength(3)
      
      // Should be sorted by earliest first
      const times = tableGroup.orders.map(o => new Date(o.routed_at).getTime())
      expect(times[0]).toBeLessThan(times[1])
      expect(times[1]).toBeLessThan(times[2])
    })

    it('should calculate earliest and latest order times correctly', () => {
      const now = new Date()
      const orders = [
        mockOrder('1', 'table-1', '5', { 
          routed_at: new Date(now.getTime() - 300000).toISOString()
        }),
        mockOrder('2', 'table-1', '5', { 
          routed_at: new Date(now.getTime() - 600000).toISOString() // earliest
        }),
        mockOrder('3', 'table-1', '5', { 
          routed_at: new Date(now.getTime() - 150000).toISOString() // latest
        }),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.earliestOrderTime.getTime()).toBe(now.getTime() - 600000)
      expect(tableGroup.latestOrderTime.getTime()).toBe(now.getTime() - 150000)
    })

    it('should calculate max elapsed time correctly', () => {
      const now = new Date()
      const orders = [
        mockOrder('1', 'table-1', '5', { 
          routed_at: new Date(now.getTime() - 900000).toISOString(), // 15 minutes ago
          started_at: null
        }),
        mockOrder('2', 'table-1', '5', { 
          routed_at: new Date(now.getTime() - 300000).toISOString(), // 5 minutes ago
          started_at: new Date(now.getTime() - 240000).toISOString() // started 4 minutes ago
        }),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      // Should use the longer elapsed time (15 minutes = 900 seconds)
      expect(tableGroup.maxElapsedTime).toBeCloseTo(900, -1)
    })
  })

  describe('Status Calculation', () => {
    it('should calculate overall status as "new" when all orders are new', () => {
      const orders = [
        mockOrder('1', 'table-1', '5', { started_at: null, completed_at: null }),
        mockOrder('2', 'table-1', '5', { started_at: null, completed_at: null }),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.overallStatus).toBe('new')
    })

    it('should calculate overall status as "preparing" when all orders are in progress', () => {
      const orders = [
        mockOrder('1', 'table-1', '5', { 
          started_at: new Date().toISOString(), 
          completed_at: null 
        }),
        mockOrder('2', 'table-1', '5', { 
          started_at: new Date().toISOString(), 
          completed_at: null 
        }),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.overallStatus).toBe('preparing')
    })

    it('should calculate overall status as "ready" when all orders are complete', () => {
      const orders = [
        mockOrder('1', 'table-1', '5', { 
          started_at: new Date().toISOString(), 
          completed_at: new Date().toISOString() 
        }),
        mockOrder('2', 'table-1', '5', { 
          started_at: new Date().toISOString(), 
          completed_at: new Date().toISOString() 
        }),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.overallStatus).toBe('ready')
    })

    it('should calculate overall status as "mixed" when orders have different statuses', () => {
      const orders = [
        mockOrder('1', 'table-1', '5', { started_at: null, completed_at: null }), // new
        mockOrder('2', 'table-1', '5', { 
          started_at: new Date().toISOString(), 
          completed_at: null 
        }), // preparing
        mockOrder('3', 'table-1', '5', { 
          started_at: new Date().toISOString(), 
          completed_at: new Date().toISOString() 
        }), // ready
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.overallStatus).toBe('mixed')
    })
  })

  describe('Item and Seat Counting', () => {
    it('should count total items across all orders', () => {
      const orders = [
        mockOrder('1', 'table-1', '5'), // 3 items (1 + 2)
        mockOrder('2', 'table-1', '5'), // 3 items (1 + 2)
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.totalItems).toBe(6)
    })

    it('should count unique seats', () => {
      const orders = [
        mockOrder('1', 'table-1', '5'),
        mockOrder('2', 'table-1', '5'),
        {
          ...mockOrder('3', 'table-1', '5'),
          order: {
            ...mockOrder('3', 'table-1', '5').order,
            seat: {
              id: 'seat-different',
              number: 2,
              table_id: 'table-1'
            }
          }
        }
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.seatCount).toBe(2) // seat-1 and seat-different
    })

    it('should handle orders without seat information', () => {
      const orders = [
        {
          ...mockOrder('1', 'table-1', '5'),
          order: {
            ...mockOrder('1', 'table-1', '5').order,
            seat: null
          }
        }
      ] as any

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.seatCount).toBe(0)
    })
  })

  describe('Priority and Recalls', () => {
    it('should calculate max priority across orders', () => {
      const orders = [
        mockOrder('1', 'table-1', '5', { priority: 3 }),
        mockOrder('2', 'table-1', '5', { priority: 8 }),
        mockOrder('3', 'table-1', '5', { priority: 5 }),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.maxPriority).toBe(8)
    })

    it('should detect recalls and count them', () => {
      const orders = [
        mockOrder('1', 'table-1', '5', { recall_count: 0 }),
        mockOrder('2', 'table-1', '5', { recall_count: 2 }),
        mockOrder('3', 'table-1', '5', { recall_count: 1 }),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.hasRecalls).toBe(true)
      expect(tableGroup.totalRecallCount).toBe(3)
    })

    it('should handle orders with no recalls', () => {
      const orders = [
        mockOrder('1', 'table-1', '5', { recall_count: 0 }),
        mockOrder('2', 'table-1', '5', { recall_count: 0 }),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.hasRecalls).toBe(false)
      expect(tableGroup.totalRecallCount).toBe(0)
    })
  })

  describe('Overdue Detection', () => {
    it('should mark groups as overdue when max elapsed time > 10 minutes', () => {
      const orders = [
        mockOrder('1', 'table-1', '5', { 
          routed_at: new Date(Date.now() - 700000).toISOString() // 11.67 minutes ago
        }),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.isOverdue).toBe(true)
    })

    it('should not mark groups as overdue when within time limit', () => {
      const orders = [
        mockOrder('1', 'table-1', '5', { 
          routed_at: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
        }),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      const tableGroup = result.current[0]
      expect(tableGroup.isOverdue).toBe(false)
    })
  })

  describe('Table Group Sorting', () => {
    it('should sort groups by earliest order time', () => {
      const orders = [
        mockOrder('1', 'table-2', '8', { 
          routed_at: new Date(Date.now() - 300000).toISOString() // newer
        }),
        mockOrder('2', 'table-1', '5', { 
          routed_at: new Date(Date.now() - 600000).toISOString() // older
        }),
      ]

      const { result } = renderHook(() => useTableGroupedOrders(orders))
      
      expect(result.current).toHaveLength(2)
      expect(result.current[0].tableLabel).toBe('Table 5') // older order first
      expect(result.current[1].tableLabel).toBe('Table 8')
    })
  })
})

describe('useTableGroupTiming', () => {
  const mockTableGroup: TableGroup = {
    tableId: 'table-1',
    tableLabel: 'Table 5',
    orders: [],
    earliestOrderTime: new Date(),
    latestOrderTime: new Date(),
    totalItems: 5,
    seatCount: 2,
    overallStatus: 'preparing',
    isOverdue: false,
    maxElapsedTime: 0,
    maxPriority: 5,
    hasRecalls: false,
    totalRecallCount: 0,
  }

  it('should return green status for new orders (≤5 minutes)', () => {
    const group = { ...mockTableGroup, maxElapsedTime: 300 } // 5 minutes

    const { result } = renderHook(() => useTableGroupTiming(group))

    expect(result.current.colorStatus).toBe('green')
    expect(result.current.colors.border).toBe('border-green-500')
    expect(result.current.colors.bg).toBe('bg-green-50 dark:bg-green-950')
  })

  it('should return yellow status for moderate wait times (5-10 minutes)', () => {
    const group = { ...mockTableGroup, maxElapsedTime: 480 } // 8 minutes

    const { result } = renderHook(() => useTableGroupTiming(group))

    expect(result.current.colorStatus).toBe('yellow')
    expect(result.current.colors.border).toBe('border-yellow-500')
    expect(result.current.colors.bg).toBe('bg-yellow-50 dark:bg-yellow-950')
  })

  it('should return red status for overdue orders (>10 minutes)', () => {
    const group = { ...mockTableGroup, maxElapsedTime: 720 } // 12 minutes

    const { result } = renderHook(() => useTableGroupTiming(group))

    expect(result.current.colorStatus).toBe('red')
    expect(result.current.colors.border).toBe('border-red-500')
    expect(result.current.colors.bg).toBe('bg-red-50 dark:bg-red-950')
  })

  it('should provide complete color scheme for each status', () => {
    const greenGroup = { ...mockTableGroup, maxElapsedTime: 200 }
    const yellowGroup = { ...mockTableGroup, maxElapsedTime: 500 }
    const redGroup = { ...mockTableGroup, maxElapsedTime: 800 }

    const { result: greenResult } = renderHook(() => useTableGroupTiming(greenGroup))
    const { result: yellowResult } = renderHook(() => useTableGroupTiming(yellowGroup))
    const { result: redResult } = renderHook(() => useTableGroupTiming(redGroup))

    // Check that all color properties are defined
    const colorProperties = ['border', 'bg', 'header', 'text', 'badge']
    
    colorProperties.forEach(prop => {
      expect(greenResult.current.colors[prop as keyof typeof greenResult.current.colors]).toBeDefined()
      expect(yellowResult.current.colors[prop as keyof typeof yellowResult.current.colors]).toBeDefined()
      expect(redResult.current.colors[prop as keyof typeof redResult.current.colors]).toBeDefined()
    })
  })

  it('should handle edge case of exactly 5 minutes', () => {
    const group = { ...mockTableGroup, maxElapsedTime: 300 } // exactly 5 minutes

    const { result } = renderHook(() => useTableGroupTiming(group))

    expect(result.current.colorStatus).toBe('green')
  })

  it('should handle edge case of exactly 10 minutes', () => {
    const group = { ...mockTableGroup, maxElapsedTime: 600 } // exactly 10 minutes

    const { result } = renderHook(() => useTableGroupTiming(group))

    expect(result.current.colorStatus).toBe('yellow')
  })
})