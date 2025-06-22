# KDS Station Reference

## Station UUIDs and Types

This document provides the actual UUIDs for KDS stations in the system, replacing the need to use station names like "salad", "grill", etc.

### Current Station Configuration

| Station Name | Type | UUID | Color | Position |
|-------------|------|------|-------|----------|
| Grill Station | `grill` | `819864b3-239a-4e7d-936d-89b84a42ac4e` | #FF6B6B | 1 |
| Fryer Station | `fryer` | `16077ddf-0453-416e-b703-667b72a49435` | #4ECDC4 | 2 |
| Salad Station | `salad` | `d95a34df-3138-45a3-a524-50ea430bc0e5` | #45B7D1 | 3 |
| Expo Station | `expo` | `47a865cb-0398-417b-8508-9a6c091c17b7` | #96CEB4 | 4 |
| Bar Station | `bar` | `1722affe-4e59-4393-b349-5ab5b40bce96` | #DDA0DD | 5 |

### Quick Reference

```typescript
// Station UUIDs for direct use
const STATION_UUIDS = {
  GRILL: '819864b3-239a-4e7d-936d-89b84a42ac4e',
  FRYER: '16077ddf-0453-416e-b703-667b72a49435',
  SALAD: 'd95a34df-3138-45a3-a524-50ea430bc0e5',
  EXPO: '47a865cb-0398-417b-8508-9a6c091c17b7',
  BAR: '1722affe-4e59-4393-b349-5ab5b40bce96',
}
```

### Usage in Code

#### Import the station constants:
```typescript
import { 
  STATION_UUIDS,
  getStationUUIDByType,
  getStationUUIDByName 
} from '@/lib/kds/station-constants'
```

#### Common patterns:

```typescript
// Get UUID by station type
const grillUUID = getStationUUIDByType('grill')
// Returns: '819864b3-239a-4e7d-936d-89b84a42ac4e'

// Get UUID by station name (supports both formats)
const barUUID = getStationUUIDByName('bar')
const barUUID2 = getStationUUIDByName('Bar Station')
// Both return: '1722affe-4e59-4393-b349-5ab5b40bce96'

// Direct access
const saladUUID = STATION_UUIDS.SALAD
// Returns: 'd95a34df-3138-45a3-a524-50ea430bc0e5'
```

### Database Queries

Instead of using station names in queries, use the actual UUIDs:

```typescript
// ❌ Old way (using station names)
const orders = await supabase
  .from('kds_order_routing')
  .select('*')
  .eq('station_id', 'salad') // This won't work

// ✅ New way (using actual UUIDs)
const orders = await supabase
  .from('kds_order_routing')
  .select('*')
  .eq('station_id', STATION_UUIDS.SALAD)

// ✅ Or with lookup helper
const stationUUID = getStationUUIDByType('salad')
const orders = await supabase
  .from('kds_order_routing')
  .select('*')
  .eq('station_id', stationUUID)
```

### Station Creation Details

These stations were created in the migration `/supabase/migrations/20250527000001_create_kds_system.sql`:

```sql
INSERT INTO kds_stations (name, type, position, color, settings) VALUES
  ('Grill Station', 'grill', 1, '#EF4444', '{"auto_bump_time": 900, "max_orders": 12}'),
  ('Fryer Station', 'fryer', 2, '#F59E0B', '{"auto_bump_time": 480, "max_orders": 8}'),
  ('Salad Station', 'salad', 3, '#10B981', '{"auto_bump_time": 300, "max_orders": 15}'),
  ('Expo Station', 'expo', 4, '#8B5CF6', '{"auto_bump_time": 120, "max_orders": 20}'),
  ('Bar Station', 'bar', 5, '#06B6D4', '{"auto_bump_time": 180, "max_orders": 10}');
```

### API Endpoints

- **GET** `/api/kds/stations` - Fetch all stations with UUIDs
- **GET** `/api/kds/orders?station_id={uuid}` - Fetch orders for specific station

### Utilities Available

The station constants file provides these utility functions:

- `getStationUUIDByType(type: string)` - Get UUID by station type
- `getStationUUIDByName(name: string)` - Get UUID by station name  
- `getStationTypeByUUID(uuid: string)` - Reverse lookup
- `isValidStationUUID(uuid: string)` - Validate station UUID
- `getStationMetadata(uuid: string)` - Get full station metadata
- `getAllStationUUIDs()` - Get all UUIDs as array
- `getAllStationTypes()` - Get all types as array

### Migration Impact

If you need to query stations programmatically, you should:

1. Replace any hardcoded station names with UUIDs
2. Use the lookup functions for dynamic station selection
3. Update any API calls to use the correct UUIDs
4. Test that routing and order management still work correctly

### Verification

To verify current station data, run:
```bash
npx tsx scripts/test-kds-query.ts
```

This will show the current stations and their UUIDs in your database.