import { describe, expect, it } from 'vitest';

import { Streami18n } from '../Streami18n';
import catalog from './catalog.fixture.json';

// Renders every key in the shipped catalog and asserts none surfaces as its own dotted path. The
// codegen proves a key has copy, but only resolving it through i18next proves the copy comes out: a
// missing bundled value, uncovered plural categories or mismatched interpolation names render a raw
// key or a literal `{{ placeholder }}`, which types cannot catch. `keys.ts` is type-only, so
// `catalog.fixture.json`, emitted by the same generator run, supplies the data.

const DOTTED_KEY = /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_]+)+$/;

/**
 * Values for the variables a key's own copy declares. Derived from the copy, so a leftover
 * `{{ placeholder }}` means i18next failed to interpolate, not that this test forgot a name.
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

/** Plural entries are `<key>_one` / `<key>_other`; call sites use the bare key plus `count`. */
const pluralBases = [
  ...new Set(
    entries
      .map(([key]) => key.match(/^(.*)_(?:zero|one|two|few|many|other)$/)?.[1])
      .filter((base): base is string => Boolean(base)),
  ),
];
/**
 * `translationBuilderTopic.*` keys are post-processor directives, not copy. Rendered without a
 * `notification` in the options the placeholder legitimately remains, so they cannot be checked
 * like copy. `NotificationTranslationBuilder.test.ts` covers them.
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
      // The catalog's copy is passed as the inline default, as prose copy is at runtime (only
      // `runtimeDefaults` keys resolve from a bundled resource), so this proves the copy renders.
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
