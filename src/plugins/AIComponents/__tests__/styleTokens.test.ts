import path from 'node:path';

import { compile } from 'sass';

const css = compile(path.resolve(__dirname, '../styling/index.scss')).css;

describe('AI components stylesheet token contract', () => {
  it('never declares --str-chat__ai-* custom properties (consumer overrides must win)', () => {
    expect(css).not.toMatch(/--str-chat__ai-[a-z-]+\s*:/);
  });

  it('reads themable tokens through override > SCR token > literal fallback chains', () => {
    expect(css).toContain(
      'var(--str-chat__ai-bg-primary, var(--str-chat__background-core-elevation-0, #ffffff))',
    );
    expect(css).toContain('var(--str-chat__ai-syntax-keyword, #8b5cf6)');
  });
});
