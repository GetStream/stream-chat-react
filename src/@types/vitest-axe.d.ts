import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module '@vitest/expect' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<T>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {
    toHaveNoViolations(): void;
  }
}
