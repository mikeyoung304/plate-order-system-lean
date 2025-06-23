Files with 'any' types:

Total 'any' types found:      291

## By Directory:

### components (      44 occurrences)
components/kds/stations/ExpoStation.tsx:12:  orders: any[]
components/kds/stations/ExpoStation.tsx:18:const getExpoPriority = (order: any) => {
components/kds/stations/ExpoStation.tsx:30:const getOrderCompleteness = (order: any) => {
components/kds/stations/ExpoStation.tsx:48:  order: any
components/kds/stations/SaladStation.tsx:12:  orders: any[]
components/kds/stations/SaladStation.tsx:74:  order: any
components/kds/stations/BarStation.tsx:12:  orders: any[]
components/kds/stations/BarStation.tsx:101:  order: any
components/kds/stations/index.ts:57:export function getOrderStation(order: any): StationType {
components/kds/stations/index.ts:78:export function filterOrdersByStation(orders: any[], stationType: StationType): any[] {
components/kds/stations/GrillStation.tsx:12:  orders: any[]
components/kds/stations/GrillStation.tsx:55:  order: any
components/kds/KDSMainContent.tsx:25:  orders?: any[]
components/kds/KDSMainContent.tsx:96:const IndividualOrderView = memo(({ orders }: { orders: any[] }) => {
components/kds/KDSMainContent.tsx:233:const TableGroupedView = memo(({ orders }: { orders: any[] }) => {
components/kds/KDSMainContent.tsx:361:const getOrderStatus = (order: any) => {
components/kds/KDSHeader.tsx:171:const getOrderStatus = (order: any) => {
components/kds/voice-command-panel-lazy.tsx:110:    SpeechRecognition: any
components/kds/voice-command-panel-lazy.tsx:111:    webkitSpeechRecognition: any
components/kds/table-group-card.tsx:42:const OrderItem = memo(({ item }: { item: any }) => {

### lib (     103 occurrences)
lib/cache/ultra-smart-cache.ts:324:  setActiveOrders: (data: any[], ttl: number = 5000) => {
lib/cache/ultra-smart-cache.ts:337:  setStationOrders: (stationId: string, data: any[], ttl: number = 5000) => {
lib/cache/ultra-smart-cache.ts:350:  setStations: (data: any[], ttl: number = 300000) => { // 5 minutes for stations
lib/cache/ultra-smart-cache.ts:363:  setTableGroups: (data: any[], ttl: number = 10000) => { // 10 seconds for table groups
lib/performance-utils.ts:60:export function throttle<T extends (...args: any[]) => any>(
lib/performance-utils.ts:67:  return function(this: any, ...args: Parameters<T>) {
lib/performance-utils.ts:89:export function debounce<T extends (...args: any[]) => any>(
lib/performance-utils.ts:95:  return function(this: any, ...args: Parameters<T>) {
lib/security/index.ts:138:  sanitizedData?: any
lib/security/index.ts:186:  static validateOrderData(data: any): ValidationResult {
lib/security/index.ts:188:    const sanitizedData: any = {}
lib/security/index.ts:212:        .map((item: any) => InputSanitizer.sanitizeOrderItem(item))
lib/initialization.ts:16:export function debounce<T extends (...args: any[]) => any>(
lib/state/domains/server-context.tsx:45:  selectedResident: any | null
lib/state/domains/server-context.tsx:68:  | { type: 'SELECT_RESIDENT'; payload: any | null }
lib/state/domains/server-context.tsx:305:  selectResident: (resident: any | null) => void
lib/state/domains/server-context.tsx:395:  const selectResident = useCallback((resident: any | null) => {
lib/state/domains/optimized-orders-context.tsx:431:    (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
lib/state/order-flow-context.tsx:21:  selectedSuggestion: any | null
lib/state/order-flow-context.tsx:31:  | { type: 'SELECT_SUGGESTION'; payload: any }

### hooks (      26 occurrences)
hooks/use-kds-orders.ts:371:  [key: string]: any
hooks/use-floor-plan-state.ts:114:      info: (message: string, ...args: any[]) =>
hooks/use-floor-plan-state.ts:116:      error: (message: string, ...args: any[]) =>
hooks/use-floor-plan-state.ts:118:      warning: (message: string, ...args: any[]) =>
hooks/use-floor-plan-state.ts:304:    } catch (error: any) {
hooks/use-floor-plan-state.ts:346:    } catch (error: any) {
hooks/use-server-state.ts:28:  userData: { user: any; profile: any } | null
hooks/use-server-state.ts:33:  selectedSuggestion: any | null
hooks/use-server-state.ts:50:  | { type: 'SET_USER_DATA'; userData: any }
hooks/use-server-state.ts:56:  | { type: 'SET_ORDER_SUGGESTIONS'; suggestions: any[] }
hooks/use-server-state.ts:57:  | { type: 'SELECT_SUGGESTION'; suggestion: any }
hooks/use-server-state.ts:226:      (userData: any) => dispatch({ type: 'SET_USER_DATA', userData }),
hooks/use-server-state.ts:257:      (suggestions: any[]) =>
hooks/use-server-state.ts:263:      (suggestion: any) => dispatch({ type: 'SELECT_SUGGESTION', suggestion }),
hooks/use-optimized-kds-orders.ts:139:      return order.items.some((item: any) => {
hooks/use-floor-plan-reducer.ts:92:      payload: { option: 'visible' | 'size' | 'snap'; value: any }
hooks/use-floor-plan-reducer.ts:569:      info: (message: string, ...args: any[]) =>
hooks/use-floor-plan-reducer.ts:571:      error: (message: string, ...args: any[]) =>
hooks/use-floor-plan-reducer.ts:573:      warning: (message: string, ...args: any[]) =>
hooks/use-floor-plan-reducer.ts:802:    } catch (error: any) {

### app (      17 occurrences)
app/api/health/route.ts:34:  details?: any
app/api/transcribe/batch/route.ts:175:    } catch (batchError: any) {
app/api/transcribe/route.ts:193:    } catch (transcriptionError: any) {
app/api/transcribe/analytics/route.ts:12:    day: any
app/api/transcribe/analytics/route.ts:13:    week: any
app/api/transcribe/analytics/route.ts:14:    month: any
app/api/transcribe/analytics/route.ts:17:    day: any
app/api/transcribe/analytics/route.ts:18:    week: any
app/api/transcribe/analytics/route.ts:19:    month: any
app/api/transcribe/analytics/route.ts:21:  cacheStats: any
app/api/transcribe/analytics/route.ts:22:  batchStats: any
app/api/transcribe/analytics/route.ts:23:  recommendations: any[]
app/api/transcribe/analytics/route.ts:24:  budgetAlerts: any[]
app/api/transcribe/analytics/route.ts:225:    const validatedLimits: any = {}
app/api/transcribe/analytics/route.ts:280:function sanitizeUsageStats(stats: any, includePersonalData: boolean) {
app/api/transcribe/analytics/route.ts:291:async function generateTrendData(_tracker: any, _userId?: string | null) {
app/kitchen/kds/components/kds-order-queue.tsx:36:  operations: any

## Common Patterns:

### Event handlers:
./contexts/kds/voice-context.tsx:        recognition.onresult = (event: any) => {
./contexts/kds/voice-context.tsx:        recognition.onerror = (event: any) => {
./__tests__/e2e/voice-ordering-flow.test.ts:        ondataavailable: ((event: any) => void) | null = null
./__tests__/e2e/voice-ordering-flow.test.ts:        onerror: ((event: any) => void) | null = null
./__tests__/e2e/voice-ordering-flow.test.ts:        ondataavailable: ((event: any) => void) | null = null

### Array types:
./types/api.ts:  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
./types/api.ts:  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K
./app/api/transcribe/analytics/route.ts:  recommendations: any[]
./app/api/transcribe/analytics/route.ts:  budgetAlerts: any[]
./components/kds/stations/ExpoStation.tsx:  orders: any[]
./components/kds/stations/SaladStation.tsx:  orders: any[]
./components/kds/stations/BarStation.tsx:  orders: any[]
./components/kds/stations/index.ts:export function filterOrdersByStation(orders: any[], stationType: StationType): any[] {
./components/kds/stations/GrillStation.tsx:  orders: any[]
./components/kds/KDSMainContent.tsx:  orders?: any[]

### Function parameters:
./types/react-window.d.ts:    children: (props: { onItemsRendered: any; ref: any }) => ReactElement
./types/api.ts:  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
./types/api.ts:  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K
./contexts/kds/order-context.tsx:  modifyOrder: (orderId: string, modifications: any) => Promise<boolean>;
./contexts/kds/voice-context.tsx:        recognition.onresult = (event: any) => {
./contexts/kds/voice-context.tsx:        recognition.onerror = (event: any) => {
./app/api/transcribe/batch/route.ts:    } catch (batchError: any) {
./app/api/transcribe/route.ts:    } catch (transcriptionError: any) {
./app/api/transcribe/analytics/route.ts:function sanitizeUsageStats(stats: any, includePersonalData: boolean) {
./app/api/transcribe/analytics/route.ts:async function generateTrendData(_tracker: any, _userId?: string | null) {

