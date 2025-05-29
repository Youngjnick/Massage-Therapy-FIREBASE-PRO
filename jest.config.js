export default {
  transform: {
    "^.+\\.jsx?$": ["babel-jest", { configFile: "./babel.config.jest.js" }],
  },
  moduleFileExtensions: ["js", "jsx", "json", "node"],
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.global-mocks.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: [
    "**/?(*.)+(test|spec).[jt]s?(x)",
    "**/jest-only-tests/**/*.[jt]s?(x)"
  ],
};