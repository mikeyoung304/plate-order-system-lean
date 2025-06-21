// KDS Module - Modular Architecture
// Export all functionality from individual modules while maintaining backward compatibility

// Types
export type {
  KDSStation,
  KDSOrderRouting,
  KDSMetric,
  KDSConfiguration,
  RoutingTarget,
  RoutingRules,
  TableSummary,
  StationPerformance
} from './types'

// Core KDS operations
export {
  fetchKDSStations,
  fetchStationOrders,
  fetchAllActiveOrders,
  bumpOrder,
  recallOrder,
  startOrderPrep,
  updateOrderPriority,
  addOrderNotes,
  createKDSStation,
  updateKDSStation,
  bulkBumpTableOrders
} from './core'

// Order routing functionality
export {
  routeOrderToStation,
  getRoutingRules,
  analyzeOrderForRouting,
  intelligentOrderRouting,
  checkAndCompleteOrder
} from './routing'

// Metrics and performance analytics
export {
  fetchStationMetrics,
  calculateAveragePrepTimes,
  getStationPerformanceAnalytics,
  recordStationMetric,
  getSystemPerformanceMetrics,
  fetchKDSConfiguration,
  updateKDSConfiguration
} from './metrics'

// Table grouping and organization
export {
  groupOrdersByTable,
  groupOrdersByTableAndSeat,
  calculateTablePriority,
  sortTablesByPriority,
  generateTableSummary,
  fetchKDSTableSummary,
  getEnhancedTableGrouping,
  filterOrdersByTableStatus,
  getOrdersNeedingAttention
} from './table-grouping'