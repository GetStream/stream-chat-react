/* eslint-disable no-undef */
module.exports = {
  globals: {
    ICAL: {},
  },
  globalSetup: './jest-global-setup.js',
  maxConcurrency: 15,
  moduleNameMapper: {
    '\\.(css|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/assetsTransformer.js',
    'mock-builders(.*)$': '<rootDir>/src/mock-builders$1',
  },
  preset: 'ts-jest',
  setupFiles: ['core-js'],
  testPathIgnorePatterns: ['/node_modules/', '/examples/', '__snapshots__', '/e2e/'],
  testRegex: [
    /**
     * If you want to test single file, mention it here
     * e.g.,
     * "src/components/ChannelList/__tests__/ChannelList.test.js",
     * "src/components/MessageList/__tests__/MessageList.test.js"
     */
  ],
  transform: {
    '\\.(ts|tsx)?$': ['ts-jest'],
    '^.+\\.(js|jsx)?$': 'babel-jest',
  },
  transformIgnorePatterns: [],
  verbose: true,
};
