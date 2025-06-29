module.exports = {
  preset: 'jest-expo',
  rootDir: './',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    './jest-setup.js'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-expo|react-native|expo|expo-.*|@react-native-community|@react-navigation|@unimodules|@react-native/js-polyfills)|(@react-native-picker/picker)))'
  ],
  moduleNameMapper: {
    '^firebase/app$': '<rootDir>/__mocks__/firebase.js',
    '^firebase/analytics$': '<rootDir>/__mocks__/firebase.js',
    '^firebase/compat/app$': '<rootDir>/__mocks__/firebase.js',
    '^firebase/compat/analytics$': '<rootDir>/__mocks__/firebase.js',
    '^../config/firebase$': '<rootDir>/__mocks__/firebase.js'
  },
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
