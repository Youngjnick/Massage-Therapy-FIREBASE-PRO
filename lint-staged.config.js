module.exports = {
  '*.{js,jsx,ts,tsx}': ['npm run lint --if-present'],
  '*.css': ['npx prettier --write'],
  '*.json': ['npx prettier --write'],
};
