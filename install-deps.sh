#!/bin/bash
set -e

# Install all dependencies listed in package.json (including devDependencies)
echo "Installing all project dependencies..."
npm install

echo "Installing required dev dependencies for testing, linting, and type support..."
npm install --save-dev react @types/react @testing-library/react @types/testing-library__react jest @types/jest eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-config-prettier @babel/core @babel/eslint-parser @babel/preset-env @babel/preset-react @babel/preset-typescript @vitejs/plugin-react vite typescript @types/react-dom @types/node babel-jest babel-plugin-transform-import-meta babel-plugin-transform-vite-meta-env @playwright/test @testing-library/jest-dom @testing-library/user-event identity-obj-proxy jest-environment-jsdom gh-pages cross-fetch firebase-admin react-icons

echo "Installing required dependencies..."
npm install firebase glob json5 jspdf react-dom react-router-dom strip-json-comments

echo "Installing Playwright browsers..."
npx playwright install

echo "All dependencies installed!"
