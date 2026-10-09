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

describe('AI components stylesheet accessibility', () => {
  it.each([
    'str-chat__ai-message-composer__round-button',
    'str-chat__ai-message-composer__select',
    'str-chat__ai-attachment-preview__retry-button',
    'str-chat__ai-attachment-preview__delete-button',
  ])('restores a visible focus indicator on .%s', (className) => {
    const rule = new RegExp(
      `\\.${className}:focus-visible[^{]*\\{[^}]*outline:\\s*2px solid var\\(--str-chat__border-utility-focused`,
    );
    expect(css).toMatch(rule);
  });

  it('moves the file input focus ring onto its visible label', () => {
    expect(css).toMatch(
      /\.str-chat__ai-message-composer__file-input:focus-visible \+ \.str-chat__ai-message-composer__round-button[^{]*\{[^}]*outline:\s*2px solid var\(--str-chat__border-utility-focused/,
    );
  });

  it('shows focus on the text input container while typing', () => {
    expect(css).toMatch(
      /\.str-chat__ai-message-composer__form:focus-within[^{]*\{[^}]*border-color/,
    );
  });

  it('disables the state indicator animations for reduced motion', () => {
    const reduced = css.split('@media (prefers-reduced-motion: reduce)')[1] ?? '';
    expect(reduced).toMatch(
      /\.str-chat__ai-state-indicator__dot[^{]*\{[^}]*animation:\s*none/,
    );
    expect(reduced).toMatch(
      /\.str-chat__ai-state-indicator__text[^{]*\{[^}]*animation:\s*none/,
    );
  });
});
