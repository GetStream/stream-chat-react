import {
  declaredIn,
  hasColourLiteral,
  unsetA2UIColours,
  unsetOpenUIColours,
  variableReads,
} from '../../../../scripts/ai-ui-token-audit.mjs';

describe('the generated UI token audit', () => {
  it('reads variables with their fallbacks, nested ones included', () => {
    expect(
      variableReads(
        'color: var(--a2ui-tabs-header-color, var(--a2ui-text-caption-color, #666));',
        'a2ui-',
      ),
    ).toEqual([
      {
        fallback: 'var(--a2ui-text-caption-color, #666)',
        name: '--a2ui-tabs-header-color',
      },
      { fallback: '#666', name: '--a2ui-text-caption-color' },
    ]);
  });

  it('tells colours written out from sizes and theme-following keywords', () => {
    for (const colour of [
      '#666',
      'rgba(0, 0, 0, 0.5)',
      'light-dark(#666, #aaa)',
      'red',
    ]) {
      expect(hasColourLiteral(colour)).toBe(true);
    }
    for (const other of ['1px', 'transparent', 'currentColor', 'bold', '0.25rem']) {
      expect(hasColourLiteral(other)).toBe(false);
    }
  });

  it('collects what a rule declares for exactly the selector asked for', () => {
    const css =
      '/* the reply */\n.str-chat__a2ui{--a2ui-text-color:red;color:blue}.str-chat__a2ui .x{--a2ui-other:1px}a,.str-chat__a2ui{/* more */--a2ui-more:0}';
    expect([...declaredIn(css, '.str-chat__a2ui')]).toEqual([
      '--a2ui-text-color',
      '--a2ui-more',
    ]);
  });

  it('finds an A2UI colour left to its fallback, and accepts one set or reached through a set one', () => {
    const sources = {
      'Modal.js':
        'color: var(--a2ui-text-color, #333); padding: var(--a2ui-modal-padding, 32px);',
      'Tabs.js':
        'color: var(--a2ui-tabs-header-color, var(--a2ui-text-caption-color, #666)); border: var(--a2ui-tabs-border, 2px solid var(--a2ui-color-border, #eee));',
    };
    expect(unsetA2UIColours(sources, new Set())).toEqual([
      { name: '--a2ui-color-border', source: 'Tabs.js', value: '#eee' },
      {
        name: '--a2ui-tabs-header-color',
        source: 'Tabs.js',
        value: 'var(--a2ui-text-caption-color, #666)',
      },
      { name: '--a2ui-text-caption-color', source: 'Tabs.js', value: '#666' },
      { name: '--a2ui-text-color', source: 'Modal.js', value: '#333' },
    ]);
    expect(
      unsetA2UIColours(
        sources,
        new Set([
          '--a2ui-text-caption-color',
          '--a2ui-text-color',
          '--a2ui-color-border',
        ]),
      ),
    ).toEqual([]);
  });

  it('finds an OpenUI colour left to its default, unless it is allowed', () => {
    const components =
      '.a{color:var(--openui-text-danger-primary);box-shadow:var(--openui-shadow-s);gap:var(--openui-space-s)}';
    const defaults =
      ':root{--openui-text-danger-primary:oklch(0.5 0.19 27 / 1);--openui-shadow-s:0 1px 3px oklch(0 0 0 / 0.02);--openui-space-s:8px}';
    expect(unsetOpenUIColours(components, defaults, new Set())).toEqual([
      {
        name: '--openui-shadow-s',
        source: 'components.css',
        value: '0 1px 3px oklch(0 0 0 / 0.02)',
      },
      {
        name: '--openui-text-danger-primary',
        source: 'components.css',
        value: 'oklch(0.5 0.19 27 / 1)',
      },
    ]);
    expect(
      unsetOpenUIColours(
        components,
        defaults,
        new Set(['--openui-text-danger-primary']),
        { '--openui-shadow-s': 'a shadow' },
      ),
    ).toEqual([]);
  });
});
