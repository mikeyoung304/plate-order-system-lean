/**
 * File enhanced by Modular Assembly with Fort Knox security
 * IMPORTANT!!! Ask the user before editing this file.
 */

import { createClient } from '@/lib/modassembly/supabase/client';
import { Security } from '@/lib/security';
import { measureApiCall } from '@/lib/performance-utils';

interface OrderRow {
  id: string;
  table_id: string;
  seat_id: string;
  resident_id: string;
  server_id: string;
  items: string[];
  transcript: string;
  status: 'new' | 'in_progress' | 'ready' | 'delivered';
  type: 'food' | 'drink';
  created_at: string;
  tables: {
    label: number;
  };
  seats: {
    label: number;
  };
}

export interface Order extends OrderRow {
  table: string;
  seat: number;
}

export async function fetchRecentOrders(limit = 5): Promise<Order[]> {
  return measureApiCall('fetch_recent_orders', async () => {
    // Security: Validate and sanitize limit parameter
    const safeLimit = Math.max(1, Math.min(50, Math.floor(limit))); // Clamp between 1-50
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        tables!inner(label),
        seats!inner(label)
      `)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }

    // Security: Sanitize all returned data
    return data.map((order: OrderRow) => ({
      ...order,
      table: Security.sanitize.sanitizeUserName(`Table ${order.tables.label}`),
      seat: Math.max(1, Math.min(20, order.seats.label)), // Validate seat number
      items: Array.isArray(order.items) 
        ? order.items
            .map((item: any) => Security.sanitize.sanitizeOrderItem(item))
            .filter((item: string) => item.length > 0)
            .slice(0, 20) // Limit items for security
        : [],
      transcript: Security.sanitize.sanitizeHTML(order.transcript || '')
    }));
  });
}

export async function createOrder(orderData: {
  table_id: string;
  seat_id: string;
  resident_id: string;
  server_id: string;
  items: string[];
  transcript: string;
  type: 'food' | 'drink';
}): Promise<Order> {
  return measureApiCall('create_order', async () => {
    // Security: Comprehensive validation of order data
    const validation = Security.validate.validateOrderData(orderData);
    if (!validation.isValid) {
      throw new Error(`Order validation failed: ${validation.errors.join(', ')}`);
    }

    // Security: Use sanitized data from validation
    const sanitizedData = validation.sanitizedData!;
    
    // Additional business logic validation
    if (!sanitizedData.items || sanitizedData.items.length === 0) {
      throw new Error('Order must contain at least one valid item');
    }
    
    if (!['food', 'drink'].includes(orderData.type)) {
      throw new Error('Invalid order type');
    }

    // Security: Validate UUIDs for IDs
    const idFields = ['table_id', 'seat_id', 'resident_id', 'server_id'];
    for (const field of idFields) {
      const value = orderData[field as keyof typeof orderData] as string;
      if (!value || typeof value !== 'string') {
        throw new Error(`Invalid ${field}`);
      }
      // UUID validation regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error(`Invalid ${field} format`);
      }
    }
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          table_id: orderData.table_id,
          seat_id: orderData.seat_id,
          resident_id: orderData.resident_id,
          server_id: orderData.server_id,
          items: sanitizedData.items,
          transcript: sanitizedData.transcript || '',
          type: orderData.type,
          status: 'in_progress'
        }
      ])
      .select(`
        *,
        tables!inner(label),
        seats!inner(label)
      `)
      .single();

    if (error) {
      console.error('Error creating order:', error);
      throw error;
    }

    try {
      const { intelligentOrderRouting } = await import('./kds');
      await intelligentOrderRouting(data.id);
      console.log(`Order ${data.id} automatically routed to KDS stations`);
    } catch (routingError) {
      console.error('Error routing order to KDS:', routingError);
      // Don't fail the order creation if routing fails
    }

    // Security: Sanitize response data
    return {
      ...data,
      table: Security.sanitize.sanitizeUserName(`Table ${data.tables.label}`),
      seat: Math.max(1, Math.min(20, data.seats.label)),
      items: Array.isArray(data.items) 
        ? data.items
            .map((item: any) => Security.sanitize.sanitizeOrderItem(item))
            .filter((item: string) => item.length > 0)
        : [],
      transcript: Security.sanitize.sanitizeHTML(data.transcript || '')
    } as Order;
  });
}

export async function updateOrderStatus(orderId: string, status: OrderRow['status']): Promise<void> {
  return measureApiCall('update_order_status', async () => {
    // Security: Validate order ID
    const sanitizedOrderId = Security.sanitize.sanitizeIdentifier(orderId);
    if (!sanitizedOrderId) {
      throw new Error('Invalid order ID');
    }
    
    // Security: Validate status
    const validStatuses = ['new', 'in_progress', 'ready', 'delivered'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', sanitizedOrderId);

    if (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  });
}

/**
 * Update order items and transcript (secure)
 * @param orderId Order ID to update
 * @param items New order items
 * @param transcript New transcript (optional)
 * @returns Updated order
 */
export async function updateOrderItems(orderId: string, items: string[], transcript?: string): Promise<Order> {
  return measureApiCall('update_order_items', async () => {
    // Security: Validate order ID
    const sanitizedOrderId = Security.sanitize.sanitizeIdentifier(orderId);
    if (!sanitizedOrderId) {
      throw new Error('Invalid order ID');
    }
    
    // Security: Sanitize and validate items
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }
    
    const sanitizedItems = items
      .map(item => Security.sanitize.sanitizeOrderItem(item))
      .filter(item => item.length > 0)
      .slice(0, 20); // Limit to 20 items
    
    if (sanitizedItems.length === 0) {
      throw new Error('Order must contain at least one valid item');
    }
    
    // Security: Sanitize transcript if provided
    const sanitizedTranscript = transcript 
      ? Security.sanitize.sanitizeHTML(transcript).slice(0, 1000)
      : undefined;

    const supabase = createClient();
    
    const updateData: { items: string[], transcript?: string } = { 
      items: sanitizedItems 
    };
    if (sanitizedTranscript) {
      updateData.transcript = sanitizedTranscript;
    }
    
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', sanitizedOrderId)
      .select(`
        *,
        tables!inner(label),
        seats!inner(label)
      `)
      .single();

    if (error) {
      console.error('Error updating order items:', error);
      throw error;
    }

    // Security: Sanitize response data
    return {
      ...data,
      table: Security.sanitize.sanitizeUserName(`Table ${data.tables.label}`),
      seat: Math.max(1, Math.min(20, data.seats.label)),
      items: Array.isArray(data.items) 
        ? data.items
            .map((item: any) => Security.sanitize.sanitizeOrderItem(item))
            .filter((item: string) => item.length > 0)
        : [],
      transcript: Security.sanitize.sanitizeHTML(data.transcript || '')
    } as Order;
  });
}

/**
 * Delete/cancel an order (secure)
 * @param orderId Order ID to delete
 */
export async function deleteOrder(orderId: string): Promise<void> {
  return measureApiCall('delete_order', async () => {
    // Security: Validate order ID
    const sanitizedOrderId = Security.sanitize.sanitizeIdentifier(orderId);
    if (!sanitizedOrderId) {
      throw new Error('Invalid order ID');
    }
    
    // UUID validation for extra security
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sanitizedOrderId)) {
      throw new Error('Invalid order ID format');
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', sanitizedOrderId);

    if (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  });
}