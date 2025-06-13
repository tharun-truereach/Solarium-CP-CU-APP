import { AxeResults } from 'axe-core';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

declare module 'jest-axe' {
  export function axe(container: Element | Document): Promise<AxeResults>;
  export function toHaveNoViolations(): {
    pass: boolean;
    message: () => string;
  };
}
