import nextJest from 'next/jest.js'

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Enhanced config for enterprise-grade testing
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/__tests__/setup/global-setup.js'
  ],
  setupFiles: ['<rootDir>/__tests__/setup/env-setup.js'],
  
  // Coverage configuration for enterprise standards
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'types/**/*.{js,ts}',
    'services/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/*.config.{js,ts}',
    '!**/stories/**',
    '!**/*.stories.*',
    '!**/demo/**',
    '!**/archive/**',
    '!**/temp/**',
    '!**/docs-archive-*/**',
    '!**/__tests__/**',
    '!**/scripts/**',
  ],
  
  // Coverage thresholds for enterprise reliability
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Critical components require higher coverage
    './components/kds/**/*.{js,jsx,ts,tsx}': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './lib/modassembly/**/*.{js,ts}': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './hooks/**/*.{js,jsx,ts,tsx}': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  
  // Test pattern matching
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).{js,jsx,ts,tsx}',
    '<rootDir>/**/*.(test|spec).{js,jsx,ts,tsx}',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/archive/',
    '<rootDir>/temp/',
    '<rootDir>/docs-archive-*/',
    '<rootDir>/.vercel/',
  ],
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    // Mock static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__tests__/mocks/file-mock.js',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@supabase))',
  ],
  
  // Test environments for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/__tests__/unit/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/__tests__/integration/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/__tests__/e2e/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      runner: 'jest-circus/runner',
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/__tests__/performance/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
    },
  ],
  
  // Performance and reliability settings
  maxWorkers: process.env.CI ? 1 : '50%',
  testTimeout: 10000,
  verbose: process.env.CI || process.env.VERBOSE_TESTS,
  bail: process.env.CI ? 1 : 0,
  
  // Reporters for CI/CD
  reporters: [
    'default',
    ...(process.env.CI ? [
      ['jest-junit', {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      }],
      ['jest-html-reporters', {
        publicPath: './coverage/html-report',
        filename: 'report.html',
        expand: true,
      }],
    ] : []),
  ],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Cache settings
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Watch mode settings
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Global test configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
    __DEV__: true,
    __TEST__: true,
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)