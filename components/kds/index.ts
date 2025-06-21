// Kitchen Display System (KDS) Components
// Refactored from original 792-line monolithic component into focused, maintainable modules

// Main layout components
export { KDSLayoutRefactored as KDSLayout } from './KDSLayoutRefactored'
export { KDSHeader } from './KDSHeader'
export { KDSMainContent } from './KDSMainContent'

// Station-specific components
export * from './stations'

// Utility components
export { OrderCard } from './order-card'
export { TableGroupCard } from './table-group-card'
export { VoiceCommandPanel } from './voice-command-panel'
export { OfflineIndicator } from './offline-indicator'