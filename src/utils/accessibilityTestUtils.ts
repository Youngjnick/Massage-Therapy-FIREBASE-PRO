// src/utils/accessibilityTestUtils.ts
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

export async function testA11y(container: HTMLElement) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}
