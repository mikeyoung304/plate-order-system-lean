'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/modassembly/supabase/client';
import { Database } from '@/types/database';

interface PerformanceMetrics {
  // Timing metrics
  averageOrderTime: number; // minutes
  averageItemTime: number; // minutes
  totalOrdersToday: number;
  totalItemsToday: number;
  
  // Queue metrics
  currentQueueLength: number;
  peakQueueLength: number;
  averageQueueWaitTime: number;
  
  // Efficiency metrics
  completionRate: number; // percentage
  onTimeDeliveryRate: number; // percentage
  bumpRate: number; // orders/hour
  
  // Real-time metrics
  ordersPerHour: number;
  itemsPerHour: number;
  activeCooks: number;
  
  // Historical data
  hourlyTrends: Array<{
    hour: number;
    orders: number;
    items: number;
    avgTime: number;
  }>;
  
  // Performance alerts
  alerts: Array<{
    id: string;
    type: 'warning' | 'critical';
    message: string;
    timestamp: number;
  }>;
}

interface MetricsState {
  current: PerformanceMetrics;
  historical: Record<string, PerformanceMetrics>; // date -> metrics
  lastUpdate: number;
  isCalculating: boolean;
  calculationError: string | null;
}

type MetricsAction =
  | { type: 'SET_CURRENT_METRICS'; payload: PerformanceMetrics }
  | { type: 'SET_HISTORICAL_METRICS'; payload: { date: string; metrics: PerformanceMetrics } }
  | { type: 'ADD_ALERT'; payload: { type: 'warning' | 'critical'; message: string } }
  | { type: 'CLEAR_ALERT'; payload: string }
  | { type: 'START_CALCULATION' }
  | { type: 'COMPLETE_CALCULATION' }
  | { type: 'FAIL_CALCULATION'; payload: string }
  | { type: 'UPDATE_REAL_TIME'; payload: Partial<PerformanceMetrics> };

const defaultMetrics: PerformanceMetrics = {
  averageOrderTime: 0,
  averageItemTime: 0,
  totalOrdersToday: 0,
  totalItemsToday: 0,
  currentQueueLength: 0,
  peakQueueLength: 0,
  averageQueueWaitTime: 0,
  completionRate: 0,
  onTimeDeliveryRate: 0,
  bumpRate: 0,
  ordersPerHour: 0,
  itemsPerHour: 0,
  activeCooks: 0,
  hourlyTrends: [],
  alerts: [],
};

const initialState: MetricsState = {
  current: defaultMetrics,
  historical: {},
  lastUpdate: 0,
  isCalculating: false,
  calculationError: null,
};

function metricsReducer(state: MetricsState, action: MetricsAction): MetricsState {
  switch (action.type) {
    case 'SET_CURRENT_METRICS':
      return {
        ...state,
        current: action.payload,
        lastUpdate: Date.now(),
      };

    case 'SET_HISTORICAL_METRICS':
      return {
        ...state,
        historical: {
          ...state.historical,
          [action.payload.date]: action.payload.metrics,
        },
      };

    case 'ADD_ALERT': {
      const newAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: action.payload.type,
        message: action.payload.message,
        timestamp: Date.now(),
      };

      return {
        ...state,
        current: {
          ...state.current,
          alerts: [newAlert, ...state.current.alerts.slice(0, 9)], // Keep max 10 alerts
        },
      };
    }

    case 'CLEAR_ALERT':
      return {
        ...state,
        current: {
          ...state.current,
          alerts: state.current.alerts.filter(alert => alert.id !== action.payload),
        },
      };

    case 'START_CALCULATION':
      return {
        ...state,
        isCalculating: true,
        calculationError: null,
      };

    case 'COMPLETE_CALCULATION':
      return {
        ...state,
        isCalculating: false,
        calculationError: null,
      };

    case 'FAIL_CALCULATION':
      return {
        ...state,
        isCalculating: false,
        calculationError: action.payload,
      };

    case 'UPDATE_REAL_TIME':
      return {
        ...state,
        current: {
          ...state.current,
          ...action.payload,
        },
        lastUpdate: Date.now(),
      };

    default:
      return state;
  }
}

interface MetricsContextValue {
  state: MetricsState;
  dispatch: React.Dispatch<MetricsAction>;
  // Metric calculations
  calculateCurrentMetrics: () => Promise<void>;
  calculateHistoricalMetrics: (date: string) => Promise<void>;
  // Real-time updates
  updateRealTimeMetrics: (updates: Partial<PerformanceMetrics>) => void;
  // Alert management
  addAlert: (type: 'warning' | 'critical', message: string) => void;
  clearAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  // Selectors
  getCurrentMetrics: () => PerformanceMetrics;
  getHistoricalMetrics: (date: string) => PerformanceMetrics | null;
  getActiveAlerts: () => PerformanceMetrics['alerts'];
  getMetricsTrend: (metric: keyof PerformanceMetrics, days: number) => number[];
}

const MetricsContext = createContext<MetricsContextValue | null>(null);

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(metricsReducer, initialState);
  const supabase = createClient();

  const calculateCurrentMetrics = useCallback(async () => {
    dispatch({ type: 'START_CALCULATION' });

    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00Z`;
      const endOfDay = `${today}T23:59:59Z`;

      // Fetch order data for today
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (ordersError) throw ordersError;

      const now = new Date();
      const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
      const oneHourAgo = new Date(startOfHour.getTime() - 60 * 60 * 1000);

      // Calculate metrics
      const totalOrders = orders?.length || 0;
      const totalItems = orders?.reduce((sum, order) => sum + (order.order_items?.length || 0), 0) || 0;
      const completedOrders = orders?.filter(order => order.status === 'completed') || [];
      const pendingOrders = orders?.filter(order => 
        order.status === 'pending' || order.status === 'preparing'
      ) || [];

      // Recent orders (last hour)
      const recentOrders = orders?.filter(order => 
        new Date(order.created_at) >= oneHourAgo
      ) || [];

      // Calculate timing metrics
      const completedOrderTimes = completedOrders
        .filter(order => order.completed_at)
        .map(order => {
          const start = new Date(order.created_at);
          const end = new Date(order.completed_at!);
          return (end.getTime() - start.getTime()) / (1000 * 60); // minutes
        });

      const averageOrderTime = completedOrderTimes.length > 0
        ? completedOrderTimes.reduce((sum, time) => sum + time, 0) / completedOrderTimes.length
        : 0;

      // Calculate hourly trends
      const hourlyTrends = [];
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
        
        const hourOrders = orders?.filter(order => {
          const orderTime = new Date(order.created_at);
          return orderTime >= hourStart && orderTime < hourEnd;
        }) || [];

        const hourItems = hourOrders.reduce((sum, order) => sum + (order.order_items?.length || 0), 0);
        const hourCompletedOrders = hourOrders.filter(order => order.status === 'completed');
        const avgTime = hourCompletedOrders.length > 0
          ? hourCompletedOrders.reduce((sum, order) => {
              if (!order.completed_at) return sum;
              const start = new Date(order.created_at);
              const end = new Date(order.completed_at);
              return sum + ((end.getTime() - start.getTime()) / (1000 * 60));
            }, 0) / hourCompletedOrders.length
          : 0;

        hourlyTrends.push({
          hour,
          orders: hourOrders.length,
          items: hourItems,
          avgTime,
        });
      }

      const metrics: PerformanceMetrics = {
        averageOrderTime,
        averageItemTime: averageOrderTime, // Simplified for now
        totalOrdersToday: totalOrders,
        totalItemsToday: totalItems,
        currentQueueLength: pendingOrders.length,
        peakQueueLength: Math.max(pendingOrders.length, state.current.peakQueueLength),
        averageQueueWaitTime: averageOrderTime * 0.7, // Estimate
        completionRate: totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0,
        onTimeDeliveryRate: 85, // TODO: Calculate based on expected vs actual times
        bumpRate: completedOrders.length > 0 ? (completedOrders.length / (now.getHours() + 1)) : 0,
        ordersPerHour: recentOrders.length,
        itemsPerHour: recentOrders.reduce((sum, order) => sum + (order.order_items?.length || 0), 0),
        activeCooks: 3, // TODO: Get from active sessions or staff table
        hourlyTrends,
        alerts: state.current.alerts, // Preserve existing alerts
      };

      // Check for performance alerts
      if (metrics.currentQueueLength > 10) {
        dispatch({
          type: 'ADD_ALERT',
          payload: {
            type: 'warning',
            message: `High queue length: ${metrics.currentQueueLength} orders pending`,
          },
        });
      }

      if (metrics.averageOrderTime > 30) {
        dispatch({
          type: 'ADD_ALERT',
          payload: {
            type: 'critical',
            message: `Long order times: ${metrics.averageOrderTime.toFixed(1)} min average`,
          },
        });
      }

      dispatch({ type: 'SET_CURRENT_METRICS', payload: metrics });
      dispatch({ type: 'COMPLETE_CALCULATION' });
    } catch (error) {
      console.error('Error calculating metrics:', error);
      dispatch({ 
        type: 'FAIL_CALCULATION', 
        payload: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, [supabase, state.current.peakQueueLength, state.current.alerts]);

  const calculateHistoricalMetrics = useCallback(async (date: string) => {
    // Similar to calculateCurrentMetrics but for a specific date
    // Implementation would be similar but with date-specific queries
    console.log('Calculating historical metrics for:', date);
  }, [supabase]);

  const updateRealTimeMetrics = useCallback((updates: Partial<PerformanceMetrics>) => {
    dispatch({ type: 'UPDATE_REAL_TIME', payload: updates });
  }, []);

  const addAlert = useCallback((type: 'warning' | 'critical', message: string) => {
    dispatch({ type: 'ADD_ALERT', payload: { type, message } });
  }, []);

  const clearAlert = useCallback((alertId: string) => {
    dispatch({ type: 'CLEAR_ALERT', payload: alertId });
  }, []);

  const clearAllAlerts = useCallback(() => {
    state.current.alerts.forEach(alert => {
      dispatch({ type: 'CLEAR_ALERT', payload: alert.id });
    });
  }, [state.current.alerts]);

  // Selectors
  const getCurrentMetrics = useCallback(() => state.current, [state.current]);

  const getHistoricalMetrics = useCallback(
    (date: string) => state.historical[date] || null,
    [state.historical]
  );

  const getActiveAlerts = useCallback(() => state.current.alerts, [state.current.alerts]);

  const getMetricsTrend = useCallback(
    (metric: keyof PerformanceMetrics, days: number) => {
      const trends: number[] = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const historicalData = state.historical[dateStr];
        if (historicalData && typeof historicalData[metric] === 'number') {
          trends.push(historicalData[metric] as number);
        } else {
          trends.push(0);
        }
      }
      
      return trends;
    },
    [state.historical]
  );

  // Auto-refresh metrics every 30 seconds
  useEffect(() => {
    calculateCurrentMetrics();
    
    const interval = setInterval(() => {
      calculateCurrentMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, [calculateCurrentMetrics]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      calculateCurrentMetrics,
      calculateHistoricalMetrics,
      updateRealTimeMetrics,
      addAlert,
      clearAlert,
      clearAllAlerts,
      getCurrentMetrics,
      getHistoricalMetrics,
      getActiveAlerts,
      getMetricsTrend,
    }),
    [
      state,
      calculateCurrentMetrics,
      calculateHistoricalMetrics,
      updateRealTimeMetrics,
      addAlert,
      clearAlert,
      clearAllAlerts,
      getCurrentMetrics,
      getHistoricalMetrics,
      getActiveAlerts,
      getMetricsTrend,
    ]
  );

  return (
    <MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics() {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  return context;
}