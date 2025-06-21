'use client';

import React from 'react';
import { StationProvider } from './station-context';
import { OrderProvider } from './order-context';
import { MetricsProvider } from './metrics-context';
import { VoiceProvider } from './voice-context';

interface KDSProvidersProps {
  children: React.ReactNode;
  stationId?: string;
}

/**
 * Combined provider wrapper for all KDS contexts
 * Ensures proper provider order and reduces nesting in components
 */
export function KDSProviders({ children, stationId }: KDSProvidersProps) {
  return (
    <StationProvider stationId={stationId}>
      <OrderProvider>
        <MetricsProvider>
          <VoiceProvider>
            {children}
          </VoiceProvider>
        </MetricsProvider>
      </OrderProvider>
    </StationProvider>
  );
}