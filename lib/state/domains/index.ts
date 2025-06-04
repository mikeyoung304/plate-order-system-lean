// Domain-Specific State Contexts
// 
// Replaces the monolithic 890-line restaurant-state-context.tsx with
// focused, maintainable domain contexts:
//
// - ConnectionContext: Real-time connection management (250 lines)
// - TablesContext: Table data and floor plan state (300 lines)
// - OrdersContext: Order lifecycle and operations (400 lines)
// - ServerContext: Server workflow and UI state (350 lines)
//
// Benefits:
// - 890 lines → 4 focused modules
// - Better performance through selective re-renders
// - Easier testing and maintenance
// - Clear separation of concerns
// - Reusable across different views

// Export all contexts
export { ConnectionProvider, useConnection, useConnectionStatus } from './connection-context'
export { TablesProvider, useTables, useTableSelection, useTablesData } from './tables-context'
export { OrdersProvider, useOrders, useOrdersData, useActiveOrders } from './orders-context'
export { ServerProvider, useServer, useServerWorkflow, useServerOrder } from './server-context'

// Combined provider for convenience
export { RestaurantProvider } from './restaurant-provider'