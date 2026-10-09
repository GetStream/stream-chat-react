import { readFileSync } from 'node:fs';
import path from 'node:path';

import { compile } from 'sass';

const css = compile(path.resolve(__dirname, '../styling/index.scss')).css;
const readTheme = (name: string) =>
  readFileSync(path.resolve(__dirname, `../../../styling/${name}.scss`), 'utf8');
const lightTheme = readTheme('light');
const darkTheme = readTheme('dark');
const declaredIn = (theme: string, token: string) => new RegExp(`${token}:`).test(theme);

describe('AI components stylesheet token contract', () => {
  it('never declares --str-chat__ai-* custom properties (consumer overrides must win)', () => {
    expect(css).not.toMatch(/--str-chat__ai-[a-z-]+\s*:/);
  });

  it('reads themable tokens through override > SCR token > literal fallback chains', () => {
    expect(css).toContain(
      'var(--str-chat__ai-bg-primary, var(--str-chat__background-core-elevation-0, #ffffff))',
    );
    expect(css).toContain('var(--str-chat__ai-syntax-keyword, #8b5cf6)');
    expect(css).toContain(
      'var(--str-chat__ai-border, var(--str-chat__border-core-default, #ccc))',
    );
    expect(css).toContain(
      'var(--str-chat__ai-table-header-bg, var(--str-chat__background-core-surface-subtle, #f8f9fa))',
    );
  });

  it('uses no colour literal outside a var() fallback (so SCR dark mode applies)', () => {
    const declarations = css
      .split(/[;{}]/)
      .map((declaration) => declaration.trim())
      .filter((declaration) => /^[a-z-]+\s*:/.test(declaration));
    const literalColours = declarations.filter((declaration) => {
      const value = declaration.slice(declaration.indexOf(':') + 1);
      return (
        /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\b(black|white)\b/i.test(value) &&
        !/var\(--str-chat__/.test(value)
      );
    });
    expect(literalColours).toEqual([]);
    expect(css).not.toContain('data:image/svg');
  });

  it('falls back only to SCR tokens that the light and dark themes both provide', () => {
    const scrTokens = [
      ...new Set(
        [...css.matchAll(/var\((--str-chat__(?!ai-)[a-z0-9-]+)/g)].map(
          ([, token]) => token,
        ),
      ),
    ];
    expect(scrTokens.length).toBeGreaterThan(5);
    const missing = scrTokens.filter((token) => {
      if (!declaredIn(lightTheme, token)) return true;
      if (declaredIn(darkTheme, token)) return false;
      // light-only semantic tokens must alias a primitive that dark.scss redefines
      const alias = lightTheme.match(
        new RegExp(`${token}:\\s*var\\(\\s*(--str-chat__[a-z0-9-]+)`),
      )?.[1];
      return !alias || !declaredIn(darkTheme, alias);
    });
    expect(missing).toEqual([]);
  });
});

describe('AI components stylesheet icons', () => {
  it('sizes and colours SCR icons without relying on index.css', () => {
    expect(css).toMatch(
      /\.str-chat__ai-message-composer__round-button svg\s*\{[^}]*width:\s*1\.5rem;[^}]*height:\s*1\.5rem;[^}]*fill:\s*currentColor/,
    );
    expect(css).toMatch(
      /\.str-chat__ai-attachment-preview__retry-button svg\s*\{[^}]*width:[^}]*fill:\s*currentColor/,
    );
    expect(css).not.toMatch(/round-button > span/);
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
