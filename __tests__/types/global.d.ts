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

  /* eslint-disable @typescript-eslint/no-namespace */
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(_expected: any[]): R;
    }
  }
  /* eslint-enable @typescript-eslint/no-namespace */
}

export {}