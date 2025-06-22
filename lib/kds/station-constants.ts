/**
 * KDS Station Constants and Utilities
 * Provides station UUID lookups and type mappings
 */

export const STATION_UUIDS = {
  GRILL: '819864b3-239a-4e7d-936d-89b84a42ac4e',
  FRYER: '16077ddf-0453-416e-b703-667b72a49435',
  SALAD: 'd95a34df-3138-45a3-a524-50ea430bc0e5',
  EXPO: '47a865cb-0398-417b-8508-9a6c091c17b7',
  BAR: '1722affe-4e59-4393-b349-5ab5b40bce96',
} as const

export const STATION_TYPES = {
  GRILL: 'grill',
  FRYER: 'fryer',
  SALAD: 'salad',
  EXPO: 'expo',
  BAR: 'bar',
} as const

export const STATION_NAMES = {
  GRILL: 'Grill Station',
  FRYER: 'Fryer Station',
  SALAD: 'Salad Station',
  EXPO: 'Expo Station',
  BAR: 'Bar Station',
} as const

/**
 * Station type to UUID mapping
 */
export const STATION_TYPE_TO_UUID: Record<string, string> = {
  grill: STATION_UUIDS.GRILL,
  fryer: STATION_UUIDS.FRYER,
  salad: STATION_UUIDS.SALAD,
  expo: STATION_UUIDS.EXPO,
  bar: STATION_UUIDS.BAR,
}

/**
 * Station name to UUID mapping
 */
export const STATION_NAME_TO_UUID: Record<string, string> = {
  'grill': STATION_UUIDS.GRILL,
  'fryer': STATION_UUIDS.FRYER,
  'salad': STATION_UUIDS.SALAD,
  'expo': STATION_UUIDS.EXPO,
  'bar': STATION_UUIDS.BAR,
  'Grill Station': STATION_UUIDS.GRILL,
  'Fryer Station': STATION_UUIDS.FRYER,
  'Salad Station': STATION_UUIDS.SALAD,
  'Expo Station': STATION_UUIDS.EXPO,
  'Bar Station': STATION_UUIDS.BAR,
}

/**
 * UUID to station type mapping
 */
export const UUID_TO_STATION_TYPE: Record<string, string> = {
  [STATION_UUIDS.GRILL]: 'grill',
  [STATION_UUIDS.FRYER]: 'fryer',
  [STATION_UUIDS.SALAD]: 'salad',
  [STATION_UUIDS.EXPO]: 'expo',
  [STATION_UUIDS.BAR]: 'bar',
}

/**
 * Get station UUID by type
 */
export function getStationUUIDByType(type: string): string | null {
  return STATION_TYPE_TO_UUID[type.toLowerCase()] || null
}

/**
 * Get station UUID by name (supports both short and full names)
 */
export function getStationUUIDByName(name: string): string | null {
  return STATION_NAME_TO_UUID[name.toLowerCase()] || STATION_NAME_TO_UUID[name] || null
}

/**
 * Get station type by UUID
 */
export function getStationTypeByUUID(uuid: string): string | null {
  return UUID_TO_STATION_TYPE[uuid] || null
}

/**
 * Validate if a UUID is a valid station UUID
 */
export function isValidStationUUID(uuid: string): boolean {
  return Object.values(STATION_UUIDS).includes(uuid as any)
}

/**
 * Get all station UUIDs as an array
 */
export function getAllStationUUIDs(): string[] {
  return Object.values(STATION_UUIDS)
}

/**
 * Get all station types as an array
 */
export function getAllStationTypes(): string[] {
  return Object.values(STATION_TYPES)
}

/**
 * Station metadata with colors and display information
 */
export const STATION_METADATA = {
  [STATION_UUIDS.GRILL]: {
    name: 'Grill Station',
    type: 'grill',
    color: '#FF6B6B',
    position: 1,
    description: 'Hot grilled items, steaks, burgers',
  },
  [STATION_UUIDS.FRYER]: {
    name: 'Fryer Station',
    type: 'fryer',
    color: '#4ECDC4',
    position: 2,
    description: 'Fried items, fries, wings, tempura',
  },
  [STATION_UUIDS.SALAD]: {
    name: 'Salad Station',
    type: 'salad',
    color: '#45B7D1',
    position: 3,
    description: 'Cold items, salads, fresh preparations',
  },
  [STATION_UUIDS.EXPO]: {
    name: 'Expo Station',
    type: 'expo',
    color: '#96CEB4',
    position: 4,
    description: 'Final assembly and plating',
  },
  [STATION_UUIDS.BAR]: {
    name: 'Bar Station',
    type: 'bar',
    color: '#DDA0DD',
    position: 5,
    description: 'Beverages, cocktails, drinks',
  },
} as const

/**
 * Get station metadata by UUID
 */
export function getStationMetadata(uuid: string) {
  return STATION_METADATA[uuid as keyof typeof STATION_METADATA] || null
}

/**
 * Type definitions for better TypeScript support
 */
export type StationUUID = typeof STATION_UUIDS[keyof typeof STATION_UUIDS]
export type StationType = typeof STATION_TYPES[keyof typeof STATION_TYPES]
export type StationName = typeof STATION_NAMES[keyof typeof STATION_NAMES]