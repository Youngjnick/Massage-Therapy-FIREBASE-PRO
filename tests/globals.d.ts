export {};

declare global {
  interface Window {
    appState: any;
    setupUI: () => void;
    fetchQuestions: () => Promise<any>;
    renderAccuracyChart: () => void;
    renderHistoryChart: () => void;
    renderMasteryHistoryChart: () => void;
    renderConfidenceChart: () => void;
    localStorageError?: boolean;
    setTestState: (patch: any) => void;
  }
}