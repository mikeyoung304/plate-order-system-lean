/**
 * Custom Jest matchers for enhanced testing
 */

/* eslint-disable @typescript-eslint/no-namespace, no-unused-vars */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(_expected: any[]): R;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace, no-unused-vars */

// Custom matcher for checking if a value is one of several options
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

export {};