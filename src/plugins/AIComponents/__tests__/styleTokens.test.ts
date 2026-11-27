/// <reference types="node" />
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { compile } from 'sass';

const css = compile(path.resolve(__dirname, '../styling/index.scss')).css;
const sdkCss = compile(path.resolve(__dirname, '../../../styling/index.scss')).css;
const readTheme = (name: string) =>
  readFileSync(path.resolve(__dirname, `../../../styling/${name}.scss`), 'utf8');
const lightTheme = readTheme('light');
const darkTheme = readTheme('dark');
const declaredIn = (theme: string, token: string) => new RegExp(`${token}:`).test(theme);
const declarations = (source: string) =>
  new Set(
    [...source.matchAll(/(--str-chat__[a-z0-9-]+)\s*:/g)].map(([, token]) => token),
  );
const reads = [
  ...new Set([...css.matchAll(/var\((--str-chat__[a-z0-9-]+)/g)].map(([, t]) => t)),
];

// The type, spacing and radius scale is the same in every theme: light.scss declares it on
// `.str-chat`, which a dark `.str-chat` has too, and dark.scss redeclares only colours.
const isScaleToken = (token: string) =>
  /^--str-chat__(spacing|typography|radius|size|space|icon-size|button-(visual-height|padding|radius|hit-target))-/.test(
    token,
  );
// A colour ramp's step is the same in every theme; the code syntax tokens pick one per theme.
// A token the light theme declares follows the dark theme when dark.scss redeclares it, or when
// it is an alias, however indirect, of one that does.
const followsDarkTheme = (token: string, depth = 0): boolean => {
  if (declaredIn(darkTheme, token)) return true;
  const alias = lightTheme.match(
    new RegExp(`${token}:\\s*var\\(\\s*(--str-chat__[a-z0-9-]+)`),
  )?.[1];
  return !!alias && depth < 8 && followsDarkTheme(alias, depth + 1);
};
const isRampStep = (token: string) =>
  /^--str-chat__(slate|neutral|blue|cyan|green|purple|yellow|red|violet|lime)-\d+$/.test(
    token,
  );

describe('AI components stylesheet token contract', () => {
  it('reads the SDK tokens, with no AI layer of its own', () => {
    expect(css).not.toMatch(/--str-chat__ai-[a-z-]+/);
    expect(css).not.toMatch(/--_str-chat-(a2ui-|ai-(?!glow-))/);
    expect(reads.length).toBeGreaterThan(40);
  });

  it('reads every SDK token without a literal fallback, so the SDK theme always decides', () => {
    expect(
      [...css.matchAll(/var\(--str-chat__[a-z0-9-]+,[^)]*/g)].map(([read]) => read),
    ).toEqual([]);
  });

  it('reads only tokens that the SDK stylesheet or this one declares', () => {
    const declared = new Set([...declarations(sdkCss), ...declarations(css)]);
    expect(reads.filter((token) => !declared.has(token))).toEqual([]);
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

  it('reads only colour tokens that the light and dark themes both provide', () => {
    const ownTokens = declarations(css);
    const missing = reads
      .filter(
        (token) => !isScaleToken(token) && !isRampStep(token) && !ownTokens.has(token),
      )
      .filter((token) => {
        if (!declaredIn(lightTheme, token)) return !declaredIn(sdkCss, token);
        return !followsDarkTheme(token);
      });
    expect(missing).toEqual([]);
  });

  it('declares the code syntax colours for the light and the dark theme', () => {
    const syntax = [...declarations(css)].filter((token) =>
      token.startsWith('--str-chat__code-syntax-'),
    );
    expect(syntax).toHaveLength(12);
    const lightBlock = css.match(
      /\.str-chat,\s*\.str-chat__theme-dark \.str-chat__theme-inverse\s*\{([^}]*)\}/,
    )?.[1];
    const darkBlock = css.match(
      /\.str-chat__theme-dark,\s*\.str-chat:not\(\.str-chat__theme-dark\)[^{]*\{([^}]*)\}/,
    )?.[1];
    for (const token of syntax) {
      expect(lightBlock).toContain(`${token}:`);
      expect(darkBlock).toContain(`${token}:`);
    }
  });
});

describe('AI components stylesheet icons', () => {
  it('sizes and colours SCR icons without relying on index.css', () => {
    expect(css).toMatch(
      /\.str-chat__ai-message-composer__round-button svg\s*\{[^}]*width:\s*var\(--str-chat__size-24\);[^}]*height:\s*var\(--str-chat__size-24\);[^}]*fill:\s*currentColor/,
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

  it('restores a visible focus indicator on a focusable voice visualization', () => {
    expect(css).toMatch(
      /\.str-chat__ai-voice-visualization:focus-visible[^{]*\{[^}]*outline:\s*2px solid var\(--str-chat__border-utility-focused/,
    );
  });

  it('lets the pointer through voice visualizations except on the shape', () => {
    expect(css).toMatch(
      /\.str-chat__ai-voice-visualization\s*\{[^}]*pointer-events:\s*none/,
    );
    expect(css).toMatch(
      /\.str-chat__ai-voice-visualization__hit\s*\{[^}]*pointer-events:\s*auto/,
    );
  });

  it('fades voice visualizations in without a transition under reduced motion', () => {
    const reduced = css
      .split('@media (prefers-reduced-motion: reduce)')
      .slice(1)
      .join('');
    expect(reduced).toMatch(
      /\.str-chat__ai-voice-visualization__canvas\s*\{[^}]*transition:\s*none/,
    );
    expect(reduced).toMatch(
      /\.str-chat__ai-voice-glow__level\s*\{[^}]*transition:\s*none/,
    );
  });

  it('animates the CSS voice glow only through transform and opacity', () => {
    const keyframes = [
      ...css.matchAll(/@keyframes str-chat__ai-glow-[a-z-]+\s*\{([\s\S]*?)\n\}/g),
    ];
    expect(keyframes.length).toBeGreaterThan(10);
    for (const [, body] of keyframes) {
      const properties = [...body.matchAll(/([a-z-]+)\s*:/g)].map(([, name]) => name);
      expect(properties.every((name) => name === 'transform' || name === 'opacity')).toBe(
        true,
      );
    }
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
