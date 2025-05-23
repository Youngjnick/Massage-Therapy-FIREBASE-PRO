export default [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", "dist/**"],
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        firebase: "readonly",
        Chart: "readonly",
        // add other globals as needed
      }
    },
    rules: {
      semi: "error",
      quotes: ["error", "double"],
      // add more rules as needed
    }
  }
];
