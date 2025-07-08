import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

export const getPlugins = (coverageEnabled) => {
  const plugins = [react()];

  if (coverageEnabled) {
    console.log('[DEBUG] Forcing Istanbul instrumentation');
    plugins.push(
      istanbul({
        include: 'src/**/*',
        exclude: [],
        extension: ['.js', '.ts', '.jsx', '.tsx'],
        cypress: false,
        requireEnv: false,
        forceBuildInstrument: true,
      })
    );
  }

  return plugins;
};
