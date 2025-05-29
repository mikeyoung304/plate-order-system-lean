# KDS Table Grouping Implementation

## Overview
Implemented table-based grouping for the Kitchen Display System (KDS) to match industry-leading standards. Orders are now grouped by table instead of displayed individually.

## Key Features Implemented

### 1. Table Grouping
- All orders from the same table are grouped together in a single card
- Table number/label is prominently displayed at the top
- Shows seat count and total items for the table

### 2. Seat Organization
- Orders are organized by seat within each table group
- Each seat shows the resident name (if available)
- Clear visual hierarchy: Table → Seats → Items

### 3. Late Arrival Handling
- When someone joins a table later, their order is automatically added to the existing table group
- Late arrivals are marked with a "Late arrival" badge
- Shows arrival time for each order to track timing

### 4. Visual Design
- Color coding based on the longest-waiting order in the group:
  - Green: 0-5 minutes
  - Yellow: 5-10 minutes  
  - Red: 10+ minutes (overdue)
- Expandable/collapsible cards for better space management
- Status indicators for new/preparing/ready orders

### 5. Bulk Operations
- "Bump Entire Table" button to mark all orders ready at once
- Individual order controls still available
- Database function for efficient bulk updates

### 6. View Modes
- **Table View** (default): Groups orders by table
- **Grid View**: Traditional individual order cards
- **List View**: Compact individual order list

## Files Created/Modified

### New Files:
1. `/hooks/use-table-grouped-orders.ts` - Hook for grouping orders by table
2. `/components/kds/table-group-card.tsx` - Table group display component
3. `/supabase/migrations/20250529000002_add_table_bulk_operations.sql` - Database support

### Modified Files:
1. `/components/kds/kds-layout.tsx` - Added table view mode and filtering
2. `/lib/modassembly/supabase/database/kds.ts` - Added bulk operations

## Usage

The table view is now the default view when accessing the KDS. Users can switch between views using the view mode selector in the header.

### Voice Commands
Voice commands work with table groups:
- "Bump order [number]" - Bumps individual order
- "Show new orders" - Filters to new orders only
- "Show overdue" - Shows overdue tables

### Real-time Updates
- New orders automatically appear in existing table groups
- Status changes update in real-time
- Table groups disappear when all orders are completed

## Future Enhancements

1. **Table Map Integration**: Show table location on floor plan
2. **Course Management**: Group items by course within seats
3. **Server Assignment**: Show which server is handling each table
4. **Predictive Timing**: AI-based completion time estimates per table
5. **Multi-Station Routing**: Track table progress across stations

## Testing

To test the implementation:
1. Create multiple orders for the same table
2. Observe how they group together
3. Add a "late arrival" order to an existing table
4. Use bulk bump to complete entire table
5. Switch between view modes to compare displays