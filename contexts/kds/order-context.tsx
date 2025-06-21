'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/modassembly/supabase/client';
import { Database } from '@/types/database';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';

interface OrderOperation {
  id: string;
  type: 'bump' | 'recall' | 'modify' | 'priority_change' | 'note_add';
  timestamp: number;
  userId?: string;
  details?: Record<string, any>;
}

interface OrderState {
  operations: Record<string, OrderOperation[]>; // orderId -> operations[]
  pendingOperations: Set<string>; // operationIds being processed
  operationHistory: OrderOperation[];
  lastOperationTime: number;
}

type OrderAction =
  | { type: 'ADD_OPERATION'; payload: OrderOperation }
  | { type: 'START_OPERATION'; payload: string } // operationId
  | { type: 'COMPLETE_OPERATION'; payload: string } // operationId
  | { type: 'FAIL_OPERATION'; payload: { operationId: string; error: string } }
  | { type: 'CLEAR_ORDER_OPERATIONS'; payload: string } // orderId
  | { type: 'SET_OPERATION_HISTORY'; payload: OrderOperation[] };

const initialState: OrderState = {
  operations: {},
  pendingOperations: new Set(),
  operationHistory: [],
  lastOperationTime: 0,
};

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'ADD_OPERATION': {
      const operation = action.payload;
      const orderId = operation.details?.orderId || '';
      
      return {
        ...state,
        operations: {
          ...state.operations,
          [orderId]: [...(state.operations[orderId] || []), operation],
        },
        operationHistory: [operation, ...state.operationHistory].slice(0, 100), // Keep last 100
        lastOperationTime: operation.timestamp,
      };
    }

    case 'START_OPERATION': {
      const newPending = new Set(state.pendingOperations);
      newPending.add(action.payload);
      return {
        ...state,
        pendingOperations: newPending,
      };
    }

    case 'COMPLETE_OPERATION': {
      const newPending = new Set(state.pendingOperations);
      newPending.delete(action.payload);
      return {
        ...state,
        pendingOperations: newPending,
      };
    }

    case 'FAIL_OPERATION': {
      const newPending = new Set(state.pendingOperations);
      newPending.delete(action.payload.operationId);
      return {
        ...state,
        pendingOperations: newPending,
      };
    }

    case 'CLEAR_ORDER_OPERATIONS': {
      const { [action.payload]: removed, ...operations } = state.operations;
      return {
        ...state,
        operations,
      };
    }

    case 'SET_OPERATION_HISTORY':
      return {
        ...state,
        operationHistory: action.payload,
      };

    default:
      return state;
  }
}

interface OrderContextValue {
  state: OrderState;
  dispatch: React.Dispatch<OrderAction>;
  // Order operations
  bumpOrder: (orderId: string, newStatus?: OrderStatus) => Promise<boolean>;
  recallOrder: (orderId: string, reason?: string) => Promise<boolean>;
  modifyOrder: (orderId: string, modifications: any) => Promise<boolean>;
  changePriority: (orderId: string, priority: OrderPriority) => Promise<boolean>;
  addNote: (orderId: string, note: string) => Promise<boolean>;
  // Operation queries
  getOrderOperations: (orderId: string) => OrderOperation[];
  isOperationPending: (operationId: string) => boolean;
  getRecentOperations: (limit?: number) => OrderOperation[];
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const supabase = createClient();

  // Helper to generate operation IDs
  const generateOperationId = useCallback(() => {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Helper to create and track operations
  const executeOperation = useCallback(async (
    type: OrderOperation['type'],
    orderId: string,
    operation: () => Promise<any>,
    details?: Record<string, any>
  ): Promise<boolean> => {
    const operationId = generateOperationId();
    const operationRecord: OrderOperation = {
      id: operationId,
      type,
      timestamp: Date.now(),
      details: { orderId, ...details },
    };

    try {
      dispatch({ type: 'START_OPERATION', payload: operationId });
      dispatch({ type: 'ADD_OPERATION', payload: operationRecord });

      await operation();

      dispatch({ type: 'COMPLETE_OPERATION', payload: operationId });
      return true;
    } catch (error) {
      console.error(`Operation ${type} failed for order ${orderId}:`, error);
      dispatch({ 
        type: 'FAIL_OPERATION', 
        payload: { operationId, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      return false;
    }
  }, [generateOperationId]);

  const bumpOrder = useCallback(async (
    orderId: string, 
    newStatus: OrderStatus = 'ready'
  ): Promise<boolean> => {
    const statusProgression: Record<OrderStatus, OrderStatus> = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'completed',
      completed: 'completed',
      cancelled: 'cancelled',
    };

    return executeOperation(
      'bump',
      orderId,
      async () => {
        // Get current order status
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .single();

        const targetStatus = newStatus === 'ready' && currentOrder?.status 
          ? statusProgression[currentOrder.status as OrderStatus]
          : newStatus;

        const { error } = await supabase
          .from('orders')
          .update({ 
            status: targetStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (error) throw error;
      },
      { newStatus }
    );
  }, [supabase, executeOperation]);

  const recallOrder = useCallback(async (
    orderId: string,
    reason?: string
  ): Promise<boolean> => {
    return executeOperation(
      'recall',
      orderId,
      async () => {
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'preparing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (error) throw error;

        // Add recall note if reason provided
        if (reason) {
          await supabase
            .from('order_notes')
            .insert({
              order_id: orderId,
              note: `Order recalled: ${reason}`,
              created_by: (await supabase.auth.getUser()).data.user?.id,
            });
        }
      },
      { reason }
    );
  }, [supabase, executeOperation]);

  const modifyOrder = useCallback(async (
    orderId: string,
    modifications: any
  ): Promise<boolean> => {
    return executeOperation(
      'modify',
      orderId,
      async () => {
        const { error } = await supabase
          .from('orders')
          .update({
            ...modifications,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (error) throw error;
      },
      { modifications }
    );
  }, [supabase, executeOperation]);

  const changePriority = useCallback(async (
    orderId: string,
    priority: OrderPriority
  ): Promise<boolean> => {
    return executeOperation(
      'priority_change',
      orderId,
      async () => {
        const { error } = await supabase
          .from('orders')
          .update({ 
            priority,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (error) throw error;
      },
      { priority }
    );
  }, [supabase, executeOperation]);

  const addNote = useCallback(async (
    orderId: string,
    note: string
  ): Promise<boolean> => {
    return executeOperation(
      'note_add',
      orderId,
      async () => {
        const { error } = await supabase
          .from('order_notes')
          .insert({
            order_id: orderId,
            note,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) throw error;
      },
      { note }
    );
  }, [supabase, executeOperation]);

  // Selectors
  const getOrderOperations = useCallback(
    (orderId: string) => state.operations[orderId] || [],
    [state.operations]
  );

  const isOperationPending = useCallback(
    (operationId: string) => state.pendingOperations.has(operationId),
    [state.pendingOperations]
  );

  const getRecentOperations = useCallback(
    (limit: number = 10) => state.operationHistory.slice(0, limit),
    [state.operationHistory]
  );

  const value = useMemo(
    () => ({
      state,
      dispatch,
      bumpOrder,
      recallOrder,
      modifyOrder,
      changePriority,
      addNote,
      getOrderOperations,
      isOperationPending,
      getRecentOperations,
    }),
    [
      state,
      bumpOrder,
      recallOrder,
      modifyOrder,
      changePriority,
      addNote,
      getOrderOperations,
      isOperationPending,
      getRecentOperations,
    ]
  );

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderOperations() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderOperations must be used within an OrderProvider');
  }
  return context;
}