export default {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current", // Ensure compatibility with the current Node.js version
        },
      },
    ],
    "@babel/preset-react"
  ],
};