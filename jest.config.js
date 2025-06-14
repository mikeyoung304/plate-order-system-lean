import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Base configuration shared by all projects
const baseConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
}

// Define test projects
const projects = [
  {
    ...baseConfig,
    displayName: 'unit',
    testMatch: ['<rootDir>/__tests__/unit/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
  {
    ...baseConfig,
    displayName: 'integration',
    testMatch: ['<rootDir>/__tests__/integration/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
  {
    ...baseConfig,
    displayName: 'e2e',
    testMatch: ['<rootDir>/__tests__/e2e/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    testEnvironment: 'node',
  },
  {
    ...baseConfig,
    displayName: 'performance',
    testMatch: ['<rootDir>/__tests__/performance/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    testEnvironment: 'node',
  },
]

// Main Jest configuration
const config = {
  projects,
  // Global settings
  coverageProvider: 'v8',
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/scripts/**',
    '!**/test-reports/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-reports',
      outputName: 'junit.xml',
    }],
    ['jest-html-reporters', {
      publicPath: 'test-reports/html',
      filename: 'report.html',
      expand: true,
    }],
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)