/**
 * Comprehensive test mocks and utilities for Project Helios
 * Provides realistic mock data for voice commands, anomaly detection, and KDS operations
 */

import type { KDSOrderRouting } from '@/lib/modassembly/supabase/database/kds'
import type { VoiceCommandResult, OrderContext, AnomalyDetectionResult } from '@/lib/kds/voice-command-processor'

// =============================================================================
// Voice Command Mocks
// =============================================================================

export const mockVoiceCommands = {
  bump: [
    'bump order 123',
    'mark order 456 ready',
    'complete order 789',
    'order 321 is done',
    'fire order 654',
    'table 5 ready',
    'bump all table 3 orders'
  ],
  recall: [
    'recall order 123',
    'bring back order 456',
    'undo order 789',
    'restore order 321',
    'return order 654'
  ],
  start: [
    'start order 123',
    'begin cooking 456',
    'commence order 789',
    'fire up order 321',
    'start all table 2 orders'
  ],
  priority: [
    'set order 123 priority high',
    'make order 456 urgent',
    'priority order 789 to medium',
    'rush order 321',
    'order 654 high priority'
  ],
  status: [
    'show new orders',
    'display overdue orders',
    'view all orders',
    'status of table 5',
    'how many pending orders'
  ],
  unknown: [
    'make me a sandwich',
    'what is the weather',
    'play some music',
    'tell me a joke',
    'abracadabra'
  ]
}

export const createMockVoiceResult = (
  command: string,
  action: string = 'bump',
  success: boolean = true
): VoiceCommandResult => ({
  command: {
    action: action as any,
    targets: [{
      type: 'order',
      value: 123,
      confidence: 0.9,
      resolved: success ? {
        id: 'routing-123',
        label: 'Order 123',
        count: 1
      } : undefined
    }],
    modifiers: [],
    originalText: command,
    normalizedText: command.toLowerCase(),
    fuzzyMatches: []
  },
  confidence: success ? 0.9 : 0.3,
  feedback: {
    message: success ? `Order 123 ${action}ed successfully` : `Failed to ${action} order 123`,
    type: success ? 'success' : 'error',
    duration: 2000,
    shouldRepeat: !success
  },
  actions: [{
    type: action as any,
    description: `${action} order 123`,
    requiresConfirmation: false,
    batchable: false
  }],
  executionResult: success ? {
    success: true,
    affectedItems: 1,
    errors: [],
    warnings: [],
    completedActions: [`${action}ed order 123`]
  } : {
    success: false,
    affectedItems: 0,
    errors: ['Order not found'],
    warnings: [],
    completedActions: []
  },
  metadata: {
    processingTime: 450,
    dbQueries: 2,
    cacheHits: 0,
    validationErrors: [],
    suggestions: success ? [] : ['Did you mean "bump order 123"?'],
    commandHistory: []
  }
})

// =============================================================================
// KDS Order Mocks
// =============================================================================

export const createMockKDSOrder = (
  id: string,
  orderNumber: number,
  tableLabel: string,
  overrides: Partial<KDSOrderRouting> = {}
): KDSOrderRouting => ({
  id: `routing-${id}`,
  order_id: `order-${id}`,
  station_id: 'station-main',
  priority: 5,
  routed_at: new Date(Date.now() - Math.random() * 1800000).toISOString(), // Random time in last 30 mins
  started_at: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 900000).toISOString() : null,
  completed_at: null,
  bumped_at: null,
  recall_count: 0,
  order: {
    id: `order-${id}`,
    order_number: orderNumber,
    status: 'pending',
    created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    items: [
      {
        id: `item-${id}-1`,
        name: `Menu Item ${Math.floor(Math.random() * 20) + 1}`,
        quantity: Math.floor(Math.random() * 3) + 1,
        special_instructions: Math.random() > 0.7 ? 'No salt' : undefined
      },
      {
        id: `item-${id}-2`,
        name: `Menu Item ${Math.floor(Math.random() * 20) + 21}`,
        quantity: Math.floor(Math.random() * 2) + 1
      }
    ],
    table: {
      id: `table-${tableLabel}`,
      label: tableLabel,
      capacity: 4
    },
    seat: {
      id: `seat-${id}`,
      number: Math.floor(Math.random() * 4) + 1,
      table_id: `table-${tableLabel}`
    },
    resident: Math.random() > 0.3 ? {
      id: `resident-${id}`,
      name: `Resident ${Math.floor(Math.random() * 100) + 1}`,
      dietary_restrictions: Math.random() > 0.8 ? ['vegetarian'] : []
    } : undefined
  },
  ...overrides
})

export const createMockOrderBatch = (
  tableLabel: string,
  count: number = 3,
  status: 'new' | 'preparing' | 'ready' | 'mixed' = 'mixed'
): KDSOrderRouting[] => {
  const orders = Array(count).fill(null).map((_, i) => {
    let orderStatus: Partial<KDSOrderRouting> = {}
    
    switch (status) {
      case 'new':
        orderStatus = { started_at: null, completed_at: null }
        break
      case 'preparing':
        orderStatus = { 
          started_at: new Date(Date.now() - Math.random() * 900000).toISOString(),
          completed_at: null 
        }
        break
      case 'ready':
        orderStatus = { 
          started_at: new Date(Date.now() - 1200000).toISOString(),
          completed_at: new Date(Date.now() - 300000).toISOString()
        }
        break
      case 'mixed':
        if (i === 0) orderStatus = { started_at: null, completed_at: null }
        else if (i === 1) orderStatus = { 
          started_at: new Date(Date.now() - 600000).toISOString(),
          completed_at: null 
        }
        else orderStatus = { 
          started_at: new Date(Date.now() - 1200000).toISOString(),
          completed_at: new Date(Date.now() - 300000).toISOString()
        }
        break
    }
    
    return createMockKDSOrder(
      `${tableLabel}-${i}`,
      100 + parseInt(tableLabel) * 10 + i,
      tableLabel,
      orderStatus
    )
  })

  return orders.sort((a, b) => 
    new Date(a.routed_at).getTime() - new Date(b.routed_at).getTime()
  )
}

// =============================================================================
// Anomaly Detection Mocks
// =============================================================================

export const createMockOrderContext = (
  orderId: string,
  tableNumber: number,
  overrides: Partial<OrderContext> = {}
): OrderContext => ({
  orderId,
  tableNumber,
  residentId: `resident-${orderId}`,
  items: [
    {
      id: `item-${orderId}-1`,
      menuItemId: 'menu-chicken-pasta',
      quantity: 2,
      specialInstructions: 'No salt'
    },
    {
      id: `item-${orderId}-2`, 
      menuItemId: 'menu-caesar-salad',
      quantity: 1
    }
  ],
  createdAt: new Date().toISOString(),
  kitchenId: 'kitchen-main',
  ...overrides
})

export const createMockAnomaly = (
  type: AnomalyDetectionResult['type'],
  severity: AnomalyDetectionResult['severity'] = 'medium',
  orderId: string = 'order-123'
): AnomalyDetectionResult => {
  const baseAnomaly = {
    type,
    severity,
    confidence: 0.85,
    affectedEntities: { orderId }
  }

  switch (type) {
    case 'duplicate':
      return {
        ...baseAnomaly,
        severity: 'high',
        confidence: 0.95,
        message: 'Duplicate order detected: Same items ordered 1 minute(s) ago',
        details: {
          originalOrderId: 'order-previous',
          originalOrderTime: new Date(Date.now() - 60000).toISOString(),
          duplicateItems: [
            { menuItemId: 'menu-chicken-pasta', quantity: 2 },
            { menuItemId: 'menu-caesar-salad', quantity: 1 }
          ]
        },
        suggestedActions: [
          'Verify with server if this is intentional',
          'Check if previous order was delivered',
          'Consider cancelling duplicate order'
        ]
      }

    case 'dietary_violation':
      return {
        ...baseAnomaly,
        severity: 'critical',
        confidence: 0.98,
        message: 'Dietary restriction violation detected for resident',
        details: {
          residentId: 'resident-123',
          violations: [
            { item: 'Chicken Alfredo Pasta', restriction: 'vegetarian' },
            { item: 'Caesar Salad', restriction: 'dairy-free' }
          ],
          restrictions: ['vegetarian', 'dairy-free']
        },
        suggestedActions: [
          'Alert server immediately',
          'Suggest alternative menu items',
          'Hold order preparation',
          'Verify with resident or caregiver'
        ]
      }

    case 'pattern':
      return {
        ...baseAnomaly,
        severity: 'medium',
        confidence: 0.78,
        message: 'Unusual ordering pattern detected',
        details: {
          features: {
            itemCount: 8,
            avgItemsPerOrder: 2.3,
            deviationFromAvg: 2.48,
            unusualItemCount: 6
          },
          anomalyScore: 0.78,
          historicalAverage: 2.3,
          currentOrder: 8
        },
        suggestedActions: [
          'Review order with resident',
          'Check for cognitive changes',
          'Verify order accuracy'
        ]
      }

    case 'capacity':
      return {
        ...baseAnomaly,
        severity: 'critical',
        confidence: 0.95,
        message: 'Kitchen at critical capacity',
        details: {
          currentLoad: '95%',
          activeOrders: 14,
          maxCapacity: 15,
          estimatedDelay: '30 minutes'
        },
        suggestedActions: [
          'Delay non-urgent orders',
          'Alert kitchen manager',
          'Consider redistributing to other kitchens',
          'Notify customers of potential delays'
        ]
      }

    case 'time':
      return {
        ...baseAnomaly,
        severity: 'high',
        confidence: 0.92,
        message: 'Order preparation time exceeded threshold',
        details: {
          prepTime: '47 minutes',
          threshold: '45 minutes',
          startedAt: new Date(Date.now() - 2820000).toISOString()
        },
        suggestedActions: [
          'Check order status with kitchen',
          'Notify server of delay',
          'Investigate preparation issues',
          'Update customer on status'
        ]
      }

    default:
      return {
        ...baseAnomaly,
        message: 'Unknown anomaly detected',
        details: {},
        suggestedActions: ['Review order manually']
      }
  }
}

// =============================================================================
// Audio/Media Mocks
// =============================================================================

export const createMockAudioBlob = (
  duration: number = 3000,
  content: string = 'mock audio data'
): Blob => {
  const audioData = new Array(Math.floor(duration / 10)).fill(content.charCodeAt(0))
  return new Blob([new Uint8Array(audioData)], { type: 'audio/webm;codecs=opus' })
}

export const createMockMediaRecorder = (
  onDataAvailable?: (data: Blob) => void,
  onStop?: () => void
): MediaRecorder => {
  const recorder = {
    start: jest.fn(() => {
      setTimeout(() => {
        if (onDataAvailable) {
          onDataAvailable(createMockAudioBlob())
        }
      }, 100)
    }),
    stop: jest.fn(() => {
      setTimeout(() => {
        if (onStop) onStop()
      }, 50)
    }),
    ondataavailable: null as any,
    onstop: null as any,
    onerror: null as any,
    state: 'inactive' as RecorderState,
    stream: null as any,
    mimeType: 'audio/webm;codecs=opus',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }

  // Set up event simulation
  recorder.start.mockImplementation(() => {
    recorder.state = 'recording'
    setTimeout(() => {
      const event = { data: createMockAudioBlob() }
      if (recorder.ondataavailable) {
        recorder.ondataavailable(event as any)
      }
    }, 100)
  })

  recorder.stop.mockImplementation(() => {
    recorder.state = 'inactive'
    setTimeout(() => {
      if (recorder.onstop) {
        recorder.onstop({} as any)
      }
    }, 50)
  })

  return recorder as any
}

// =============================================================================
// Database Response Mocks
// =============================================================================

export const createMockSupabaseResponse = <T>(
  data: T | null = null,
  error: any = null,
  count: number | null = null
) => ({
  data,
  error,
  count,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
})

export const createMockSupabaseClient = () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  and: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(createMockSupabaseResponse(null)),
  maybeSingle: jest.fn().mockResolvedValue(createMockSupabaseResponse(null)),
  then: jest.fn().mockResolvedValue(createMockSupabaseResponse([])),
  
  // Auth methods
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'mock-user-id', email: 'test@example.com' } },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  },
  
  // Real-time methods
  channel: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn()
  })
})

// =============================================================================
// Performance Testing Utilities
// =============================================================================

export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  label: string = 'operation'
): Promise<{ result: T, duration: number, memory?: number }> => {
  const startTime = performance.now()
  const startMemory = (performance as any).memory?.usedJSHeapSize

  const result = await operation()

  const endTime = performance.now()
  const endMemory = (performance as any).memory?.usedJSHeapSize
  const duration = endTime - startTime
  const memory = startMemory && endMemory ? endMemory - startMemory : undefined

  console.log(`${label} took ${duration.toFixed(2)}ms`)
  if (memory) {
    console.log(`${label} used ${(memory / 1024 / 1024).toFixed(2)}MB`)
  }

  return { result, duration, memory }
}

export const createLoadTestData = (
  orderCount: number = 100,
  tableCount: number = 20
): { orders: KDSOrderRouting[], tables: string[] } => {
  const tables = Array(tableCount).fill(null).map((_, i) => (i + 1).toString())
  const orders: KDSOrderRouting[] = []

  for (let i = 0; i < orderCount; i++) {
    const tableLabel = tables[Math.floor(Math.random() * tables.length)]
    orders.push(createMockKDSOrder(
      i.toString(),
      1000 + i,
      tableLabel,
      {
        priority: Math.floor(Math.random() * 10) + 1,
        recall_count: Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0
      }
    ))
  }

  return { orders, tables }
}

// =============================================================================
// Test Scenario Builders
// =============================================================================

export const buildScenario = {
  highVolumeKitchen: () => {
    const { orders } = createLoadTestData(50, 15)
    return {
      orders: orders.map(order => ({
        ...order,
        started_at: Math.random() > 0.3 ? 
          new Date(Date.now() - Math.random() * 1800000).toISOString() : null
      })),
      anomalies: [
        createMockAnomaly('capacity', 'critical'),
        createMockAnomaly('time', 'high'),
        createMockAnomaly('pattern', 'medium')
      ]
    }
  },

  quietPeriod: () => {
    const { orders } = createLoadTestData(5, 3)
    return {
      orders,
      anomalies: []
    }
  },

  dietaryComplications: () => {
    const orders = [
      createMockKDSOrder('diet-1', 201, '5'),
      createMockKDSOrder('diet-2', 202, '8')
    ]
    return {
      orders,
      anomalies: [
        createMockAnomaly('dietary_violation', 'critical', 'order-diet-1'),
        createMockAnomaly('dietary_violation', 'critical', 'order-diet-2')
      ]
    }
  },

  rushHour: () => {
    const { orders } = createLoadTestData(75, 25)
    const now = Date.now()
    
    return {
      orders: orders.map((order, i) => ({
        ...order,
        routed_at: new Date(now - (orders.length - i) * 2000).toISOString(), // 2 seconds apart
        priority: i < 10 ? 8 : Math.floor(Math.random() * 7) + 1 // First 10 are high priority
      })),
      anomalies: [
        createMockAnomaly('capacity', 'critical'),
        createMockAnomaly('duplicate', 'high'),
        createMockAnomaly('pattern', 'medium')
      ]
    }
  }
}

export { mockVoiceCommands as voiceCommands }