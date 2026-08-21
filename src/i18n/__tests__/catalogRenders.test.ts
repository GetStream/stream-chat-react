import { describe, expect, it } from 'vitest';

import { Streami18n } from '../Streami18n';
import catalog from './catalog.fixture.json';

/**
 * Renders every key in the shipped catalog and asserts none of them surfaces as its own dotted path.
 *
 * This is the net for the one failure mode the codegen cannot catch statically: the generator proves a
 * key *has* copy somewhere, but only actually resolving it through i18next proves the copy comes out.
 * A key whose bundled value went missing, whose plural forms do not cover the categories it is called
 * with, or whose interpolation names do not match what the call site passes, all render as a raw key or
 * with a literal `{{ placeholder }}` — visible to a user, invisible to types.
 *
 * `keys.ts` is type-only, so a test cannot iterate it. `catalog.fixture.json` is its data twin, emitted
 * by the same generator run and living under `__tests__` so it never reaches the published build. Ported
 * from the React Native SDK, which had it first.
 */
const DOTTED_KEY = /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_]+)+$/;

/**
 * Values for whichever variables a key's own copy declares.
 *
 * Derived from the copy rather than a fixed list, so a leftover `{{ placeholder }}` means i18next
 * genuinely failed to interpolate something it was handed — not merely that this test forgot a name.
 * `{{ x | formatter(...) }}` and `{{ x, formatter }}` both name the variable first.
 */
const interpolationValuesFor = (copy: string) => {
  const values: Record<string, unknown> = {
    count: 2,
    milliseconds: 60_000,
    timestamp: '2026-03-13T14:32:00.000Z',
  };
  for (const [, inner] of copy.matchAll(/\{\{([^}]*)\}\}/g)) {
    const name = inner.split(/[|,]/)[0].trim();
    if (name && !(name in values)) values[name] = 'x';
  }
  return values;
};

const entries = Object.entries(catalog as Record<string, string>);

const catalogOf = (key: string) => (catalog as Record<string, string>)[key];

/** Plural entries live as `<key>_one` / `<key>_other`; call sites use the bare handle plus `count`. */
const pluralBases = [
  ...new Set(
    entries
      .map(([key]) => key.match(/^(.*)_(?:zero|one|two|few|many|other)$/)?.[1])
      .filter((base): base is string => Boolean(base)),
  ),
];
/**
 * `translationBuilderTopic.*` keys are post-processor *directives*, not copy.
 *
 * Their value (`{{value, notification}}`) names a post-processor, and the post-processor replaces the
 * whole resolved string once it is handed the object it dispatches on. Rendered bare — with no
 * `notification` in the options — the topic passes through and the placeholder legitimately remains, so
 * they cannot be checked the way copy is. `NotificationTranslationBuilder.test.ts` covers them.
 */
const isDirective = (key: string) => key.startsWith('translationBuilderTopic.');

const singularKeys = entries
  .map(([key]) => key)
  .filter((key) => !/_(?:zero|one|two|few|many|other)$/.test(key) && !isDirective(key));

describe('translation catalog renders', () => {
  it('has entries to check', () => {
    expect(entries.length).toBeGreaterThan(400);
    expect(pluralBases.length).toBeGreaterThan(0);
  });

  it('renders every singular key without leaking the key or a placeholder', async () => {
    const { t } = await new Streami18n({ logger: () => {} }).init();
    const render = t as unknown as (
      key: string,
      d?: string | Record<string, unknown>,
      o?: Record<string, unknown>,
    ) => string;

    const offenders: string[] = [];
    for (const key of singularKeys) {
      // The catalog's own copy is passed as the inline default, because that is where prose copy comes
      // from at runtime — only `runtimeDefaults` keys resolve from a bundled resource. What this proves
      // is that the declared copy actually renders: interpolation names line up, and a bundled key is
      // not missing.
      const rendered = render(
        key,
        catalogOf(key),
        interpolationValuesFor(catalogOf(key)),
      );
      if (!rendered || rendered === key || DOTTED_KEY.test(rendered)) {
        offenders.push(`${key} -> ${JSON.stringify(rendered)}`);
      } else if (rendered.includes('{{')) {
        offenders.push(`${key} left a placeholder -> ${JSON.stringify(rendered)}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('renders every plural key at each count without leaking the key or a placeholder', async () => {
    const { t } = await new Streami18n({ logger: () => {} }).init();
    const render = t as unknown as (key: string, o: Record<string, unknown>) => string;

    const offenders: string[] = [];
    for (const base of pluralBases) {
      for (const count of [0, 1, 2, 5]) {
        const forms = [`${base}_one`, `${base}_other`, `${base}_few`, `${base}_many`]
          .map(catalogOf)
          .filter(Boolean)
          .join(' ');
        const rendered = render(base, {
          ...interpolationValuesFor(forms),
          count,
          defaultValue_one: catalogOf(`${base}_one`),
          defaultValue_other: catalogOf(`${base}_other`),
        });
        if (!rendered || rendered === base || DOTTED_KEY.test(rendered)) {
          offenders.push(`${base} @ ${count} -> ${JSON.stringify(rendered)}`);
        } else if (rendered.includes('{{')) {
          offenders.push(
            `${base} @ ${count} left a placeholder -> ${JSON.stringify(rendered)}`,
          );
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
