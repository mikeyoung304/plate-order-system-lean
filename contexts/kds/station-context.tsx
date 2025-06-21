'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/modassembly/supabase/client';
import { Database } from '@/types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

type Order = Database['public']['Tables']['orders']['Row'] & {
  table: Database['public']['Tables']['tables']['Row'];
  server: Database['public']['Tables']['profiles']['Row'];
};

interface StationState {
  orders: Record<string, Order>;
  activeOrders: string[];
  completedOrders: string[];
  stationStatus: 'online' | 'offline' | 'busy';
  lastUpdate: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

type StationAction =
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: { id: string; order: Partial<Order> } }
  | { type: 'REMOVE_ORDER'; payload: string }
  | { type: 'SET_STATION_STATUS'; payload: 'online' | 'offline' | 'busy' }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connected' | 'connecting' | 'disconnected' }
  | { type: 'UPDATE_TIMESTAMP' };

const initialState: StationState = {
  orders: {},
  activeOrders: [],
  completedOrders: [],
  stationStatus: 'online',
  lastUpdate: Date.now(),
  connectionStatus: 'connecting',
};

function stationReducer(state: StationState, action: StationAction): StationState {
  switch (action.type) {
    case 'SET_ORDERS': {
      const orders: Record<string, Order> = {};
      const activeOrders: string[] = [];
      const completedOrders: string[] = [];

      action.payload.forEach(order => {
        orders[order.id] = order;
        if (order.status === 'delivered' || order.status === 'cancelled') {
          completedOrders.push(order.id);
        } else {
          activeOrders.push(order.id);
        }
      });

      return {
        ...state,
        orders,
        activeOrders,
        completedOrders,
        lastUpdate: Date.now(),
      };
    }

    case 'ADD_ORDER': {
      const order = action.payload;
      const isActive = order.status !== 'delivered' && order.status !== 'cancelled';

      return {
        ...state,
        orders: { ...state.orders, [order.id]: order },
        activeOrders: isActive 
          ? [...state.activeOrders, order.id]
          : state.activeOrders,
        completedOrders: !isActive
          ? [...state.completedOrders, order.id]
          : state.completedOrders,
        lastUpdate: Date.now(),
      };
    }

    case 'UPDATE_ORDER': {
      const { id, order: updates } = action.payload;
      const existingOrder = state.orders[id];
      if (!existingOrder) return state;

      const updatedOrder = { ...existingOrder, ...updates };
      const wasActive = existingOrder.status !== 'delivered' && existingOrder.status !== 'cancelled';
      const isActive = updatedOrder.status !== 'delivered' && updatedOrder.status !== 'cancelled';

      let activeOrders = state.activeOrders;
      let completedOrders = state.completedOrders;

      if (wasActive && !isActive) {
        activeOrders = activeOrders.filter(orderId => orderId !== id);
        completedOrders = [...completedOrders, id];
      } else if (!wasActive && isActive) {
        completedOrders = completedOrders.filter(orderId => orderId !== id);
        activeOrders = [...activeOrders, id];
      }

      return {
        ...state,
        orders: { ...state.orders, [id]: updatedOrder },
        activeOrders,
        completedOrders,
        lastUpdate: Date.now(),
      };
    }

    case 'REMOVE_ORDER': {
      const { [action.payload]: removed, ...orders } = state.orders;
      return {
        ...state,
        orders,
        activeOrders: state.activeOrders.filter(id => id !== action.payload),
        completedOrders: state.completedOrders.filter(id => id !== action.payload),
        lastUpdate: Date.now(),
      };
    }

    case 'SET_STATION_STATUS':
      return { ...state, stationStatus: action.payload };

    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };

    case 'UPDATE_TIMESTAMP':
      return { ...state, lastUpdate: Date.now() };

    default:
      return state;
  }
}

interface StationContextValue {
  state: StationState;
  dispatch: React.Dispatch<StationAction>;
  // Optimized selectors
  getOrder: (id: string) => Order | undefined;
  getActiveOrders: () => Order[];
  getCompletedOrders: () => Order[];
  getOrdersByTable: (tableId: string) => Order[];
  getOrdersByStatus: (status: string) => Order[];
  // Actions
  refreshOrders: () => Promise<void>;
}

const StationContext = createContext<StationContextValue | null>(null);

export function StationProvider({ 
  children,
  stationId,
}: { 
  children: React.ReactNode;
  stationId?: string;
}) {
  const [state, dispatch] = useReducer(stationReducer, initialState);
  const supabase = createClient();
  const channelRef = React.useRef<RealtimeChannel | null>(null);

  // Memoized selectors
  const getOrder = useCallback((id: string) => state.orders[id], [state.orders]);

  const getActiveOrders = useCallback(
    () => state.activeOrders.map(id => state.orders[id]).filter(Boolean),
    [state.activeOrders, state.orders]
  );

  const getCompletedOrders = useCallback(
    () => state.completedOrders.map(id => state.orders[id]).filter(Boolean),
    [state.completedOrders, state.orders]
  );

  const getOrdersByTable = useCallback(
    (tableId: string) => 
      Object.values(state.orders).filter(order => order.table_id === tableId),
    [state.orders]
  );

  const getOrdersByStatus = useCallback(
    (status: string) => 
      Object.values(state.orders).filter(order => order.status === status),
    [state.orders]
  );

  const refreshOrders = useCallback(async () => {
    try {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });

      const query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            item:items (*)
          ),
          table:tables (*),
          server:profiles (*)
        `)
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (stationId) {
        query.eq('station_id', stationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      dispatch({ type: 'SET_ORDERS', payload: data || [] });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
    } catch (_error) {
      console.error('Error fetching orders:', _error);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
    }
  }, [supabase, stationId]);

  // Set up real-time subscriptions
  useEffect(() => {
    refreshOrders();

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel for real-time updates
    const channel = supabase
      .channel(`station-${stationId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: stationId ? `station_id=eq.${stationId}` : undefined,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Fetch full order data with relations
            const { data } = await supabase
              .from('orders')
              .select(`
                *,
                order_items (
                  *,
                  item:items (*)
                ),
                table:tables (*),
                server:profiles (*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              if (payload.eventType === 'INSERT') {
                dispatch({ type: 'ADD_ORDER', payload: data });
              } else {
                dispatch({ type: 'UPDATE_ORDER', payload: { id: data.id, order: data } });
              }
            }
          } else if (payload.eventType === 'DELETE') {
            dispatch({ type: 'REMOVE_ORDER', payload: payload.old.id });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => {
          // Refresh orders when order items change
          refreshOrders();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
        } else if (status === 'CLOSED') {
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase, stationId, refreshOrders]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      getOrder,
      getActiveOrders,
      getCompletedOrders,
      getOrdersByTable,
      getOrdersByStatus,
      refreshOrders,
    }),
    [
      state,
      getOrder,
      getActiveOrders,
      getCompletedOrders,
      getOrdersByTable,
      getOrdersByStatus,
      refreshOrders,
    ]
  );

  return (
    <StationContext.Provider value={value}>
      {children}
    </StationContext.Provider>
  );
}

export function useStation() {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error('useStation must be used within a StationProvider');
  }
  return context;
}