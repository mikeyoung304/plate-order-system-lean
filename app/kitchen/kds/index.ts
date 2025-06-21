// KDS Module Exports
// New modular architecture for the Kitchen Display System

// Main layout
export { KDSLayout } from './kds-layout'

// Providers
export { KDSStateProvider, useKDSContext, useKDSSelector } from './providers/kds-state-provider'

// Components
export { KDSStationGrid } from './components/kds-station-grid'
export { KDSOrderQueue } from './components/kds-order-queue'
export { KDSMetricsDashboard } from './components/kds-metrics-dashboard'

// Hooks
export { useKDSOperations } from './hooks/use-kds-operations'
export type { KDSOperations } from './hooks/use-kds-operations'

// Re-export types for convenience
export type { 
  KDSOrderRouting, 
  KDSStation, 
  KDSMetric, 
  KDSConfiguration 
} from '@/lib/modassembly/supabase/database/kds/types'