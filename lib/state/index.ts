// Restaurant State Management
// 
// MIGRATION GUIDE:
// The original 890-line restaurant-state-context.tsx has been refactored into
// domain-specific contexts for better maintainability and performance.
//
// OLD (Monolithic):
// import { useRestaurantState } from '@/lib/state/restaurant-state-context'
//
// NEW (Domain-Specific):
// import { useConnection, useTables, useOrders, useServer } from '@/lib/state/domains'
//
// Or use the combined provider:
// import { RestaurantProvider } from '@/lib/state/domains'

// Export new domain-specific contexts (recommended)
export * from './domains'

// Export legacy context for backward compatibility
export { default as RestaurantStateContext } from './restaurant-state-context'

// Export other state utilities
export { OrderFlowProvider, useOrderFlow } from './order-flow-context'