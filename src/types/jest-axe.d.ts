declare module 'jest-axe' {
  import { AxeResults, RunOptions } from 'axe-core';
  import { MatcherFunction } from '@testing-library/jest-dom/matchers';

  export function axe(
    html: HTMLElement | string,
    options?: RunOptions
  ): Promise<AxeResults>;

  export const toHaveNoViolations: MatcherFunction<[AxeResults?]>;
}
