declare module "*.json" {
  const value: any;
  export default value;
}

// Extend the Window interface for E2E/debug globals
interface Window {
  __LAST_QUIZ_RESULT__?: any;
  __LAST_QUIZ_QUESTION__?: any;
  __TOPIC_STATS__?: any;
}
