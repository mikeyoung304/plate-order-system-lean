/**
 * Global type declarations for test environment
 */

declare global {
  interface Window {
    testOrder?: any;
    testOrders?: any;
    mockTranscription?: string;
    voiceProcessor?: any;
  }

  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}

export {}