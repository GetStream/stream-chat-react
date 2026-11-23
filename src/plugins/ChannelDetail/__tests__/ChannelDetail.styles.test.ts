/// <reference types="node" />
import path from 'node:path';

import { compile } from 'sass';

const css = compile(path.resolve(__dirname, '../styling/index.scss')).css;

type CssRule = {
  declarations: Record<string, string>;
  media?: string;
  selectors: string[];
};

// Splits a selector list on its top-level commas, leaving those inside `:where(…)` and the like.
const splitSelectorList = (selectorText: string) => {
  const selectors: string[] = [];
  let depth = 0;
  let current = '';
  for (const character of selectorText) {
    if (character === ',' && depth === 0) {
      selectors.push(current.trim());
      current = '';
      continue;
    }
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    current += character;
  }
  return [...selectors, current.trim()];
};

const parseRules = (source: string, media?: string): CssRule[] =>
  [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectorText, body]) => ({
    declarations: Object.fromEntries(
      body
        .split(';')
        .map((declaration) => declaration.trim())
        .filter(Boolean)
        .map((declaration) => {
          const separatorIndex = declaration.indexOf(':');
          return [
            declaration.slice(0, separatorIndex).trim(),
            declaration.slice(separatorIndex + 1).trim(),
          ];
        }),
    ),
    media,
    selectors: splitSelectorList(selectorText),
  }));

const mediaBlockPattern = /@media([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g;

const rules: CssRule[] = [
  ...parseRules(css.replace(mediaBlockPattern, '')),
  ...[...css.matchAll(mediaBlockPattern)].flatMap(([, query, body]) =>
    parseRules(body, query.trim()),
  ),
];

const declarationsFor = (selector: string, media?: string) =>
  Object.assign(
    {},
    ...rules
      .filter((rule) => rule.media === media && rule.selectors.includes(selector))
      .map((rule) => rule.declarations),
  ) as Record<string, string>;

const SIZE_PROPERTIES = ['width', 'height', 'max-width', 'max-height', 'min-width'];
const FULL_SCREEN_MEDIA = '(max-width: 679.98px)';
const IN_MODAL = ':where(.str-chat__modal__dialog, .str-chat__channel-detail-modal)';
const MODAL_ROOT = `${IN_MODAL} .str-chat__channel-detail`;
// The compound selector of the element a selector targets: the part after its last combinator.
const targetCompound = (selector: string) =>
  selector
    .replace(/:where\([^)]*\)/g, (where) => where.replace(/\s/g, ''))
    .split(/[\s>+~]+/)
    .pop() ?? '';
// The number of classes outside `:where()`, which sets the selector's specificity here.
const countedClasses = (selector: string) =>
  (selector.replace(/:where\([^)]*\)/g, '').match(/\.[\w-]+/g) ?? []).length;

const FULL_SCREEN = {
  height: '100dvh',
  'max-width': 'none',
  width: '100dvw',
};

describe('ChannelDetail stylesheet', () => {
  it('fills its container', () => {
    expect(declarationsFor('.str-chat__channel-detail')).toMatchObject({
      height: '100%',
      width: '100%',
    });
  });

  it('sizes no layout outside a modal, so the measured width cannot flip the layout', () => {
    const layoutSizeDeclarations = rules
      .filter((rule) =>
        rule.selectors.some(
          (selector) =>
            /\.str-chat__channel-detail--inline(?![\w-])/.test(
              targetCompound(selector),
            ) && !selector.startsWith(IN_MODAL),
        ),
      )
      .flatMap((rule) =>
        SIZE_PROPERTIES.filter((property) => property in rule.declarations),
      );

    expect(layoutSizeDeclarations).toEqual([]);
  });

  it('keeps the 800×640 window in a modal, never narrower than the tabs layout needs', () => {
    expect(declarationsFor(MODAL_ROOT)).toMatchObject({
      height: 'min(640px, 100vh - 2 * var(--str-chat__spacing-lg))',
      width: 'min(800px, max(640px, 100vw - 2 * var(--str-chat__spacing-lg)))',
    });
  });

  it('sizes the modal at the specificity of the root class, so an app size for it wins', () => {
    const modalSelectors = rules
      .flatMap((rule) => rule.selectors)
      .filter((selector) => selector.startsWith(IN_MODAL));

    expect(modalSelectors.length).toBeGreaterThan(0);
    expect(modalSelectors.map(countedClasses)).toEqual(modalSelectors.map(() => 1));
  });

  it('goes full screen in a modal on a narrow viewport', () => {
    expect(declarationsFor(MODAL_ROOT, FULL_SCREEN_MEDIA)).toMatchObject({
      ...FULL_SCREEN,
      'border-radius': '0',
    });
  });

  it('goes full screen in a modal in the inline layout', () => {
    expect(
      declarationsFor(`${MODAL_ROOT}:where(.str-chat__channel-detail--inline)`),
    ).toMatchObject(FULL_SCREEN);
  });
});
