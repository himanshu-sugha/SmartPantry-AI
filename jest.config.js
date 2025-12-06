const nextJest = require('next/jest')

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: [
        '**/__tests__/**/*.test.[jt]s?(x)',
        '**/*.test.[jt]s?(x)',
    ],
    collectCoverageFrom: [
        'src/services/**/*.ts',
        'src/hooks/**/*.ts',
        '!src/**/*.d.ts',
    ],
}

module.exports = createJestConfig(customJestConfig)
