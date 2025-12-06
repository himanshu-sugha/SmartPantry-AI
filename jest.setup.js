// Jest setup file
require('@testing-library/jest-dom');

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
    value: {
        getRandomValues: function (arr) {
            for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        },
        subtle: {
            generateKey: jest.fn(),
            encrypt: jest.fn(),
            decrypt: jest.fn(),
        },
    },
});
