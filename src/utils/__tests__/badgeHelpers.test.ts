import { getBadgeIconPath, Badge } from '../badgeHelpers';

describe('getBadgeIconPath', () => {
  it('returns default icon path if badge is null/undefined', () => {
    expect(getBadgeIconPath(undefined as unknown as Badge)).toBe('/badges/SOAP_star_basic.png');
    expect(getBadgeIconPath(null as unknown as Badge)).toBe('/badges/SOAP_star_basic.png');
  });

  it('returns correct path for badge with icon property', () => {
    expect(getBadgeIconPath({ id: 'accuracy_100', icon: 'star' } as Badge)).toBe('/badges/star.png');
    expect(getBadgeIconPath({ id: 'accuracy_100', icon: 'star.png' } as Badge)).toBe('/badges/star.png');
  });

  it('returns correct path for badge with only id', () => {
    expect(getBadgeIconPath({ id: 'first_quiz' } as Badge)).toBe('/badges/first_quiz.png');
  });

  it('returns default icon for missing/empty icon', () => {
    expect(getBadgeIconPath({ id: '', icon: '' } as Badge)).toBe('/badges/SOAP_star_basic.png');
  });

  it('returns default icon for icon === "default.png"', () => {
    expect(getBadgeIconPath({ id: 'foo', icon: 'default.png' } as Badge)).toBe('/badges/SOAP_star_basic.png');
  });

  it('normalizes icon name (lowercase, underscores)', () => {
    expect(getBadgeIconPath({ id: 'SOAP Star Basic' } as Badge)).toBe('/badges/soap_star_basic.png');
    expect(getBadgeIconPath({ id: 'SOAP-Star-Basic' } as Badge)).toBe('/badges/soap_star_basic.png');
  });

  it('returns correct path in E2E mode (window.__E2E_TEST__ = true)', () => {
    // Patch: Use globalThis.window as Partial<Window> & { __E2E_TEST__?: boolean }
    const origWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      value: { __E2E_TEST__: true },
      configurable: true
    });
    expect(getBadgeIconPath({ id: 'testBadge' } as Badge)).toBe('/badges/testbadge.png');
    Object.defineProperty(globalThis, 'window', {
      value: origWindow,
      configurable: true
    });
  });
});
