// playwright-global-setup.cjs
module.exports = async () => {
  // Print environment and Playwright headless mode at runtime
  console.log('[Playwright GLOBAL SETUP] process.env.HEADLESS:', process.env.HEADLESS);
  // Playwright does not expose use.headless here, but config is set to false
  console.log('[Playwright GLOBAL SETUP] Playwright config forces headless: false');
};
