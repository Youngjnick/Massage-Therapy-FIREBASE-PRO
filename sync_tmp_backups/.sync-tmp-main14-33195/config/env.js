export const isCoverageEnabled = () => process.env.COVERAGE === 'true';
export const isProduction = () => process.env.NODE_ENV === 'production';
