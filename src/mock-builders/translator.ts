type TOptions = Record<string, unknown> & {
  count?: number;
  defaultValue?: string;
  defaultValue_one?: string;
  defaultValue_other?: string;
};

const interpolate = (template: string, params: Record<string, unknown>) =>
  template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, name: string) => {
    const value = params[name];
    return value === undefined || value === null ? whole : String(value);
  });

/**
 * Stand-in for `t` that mirrors the parts of i18next's resolution the SDK relies on: the
 * positional `defaultValue`, the `defaultValue_one` / `defaultValue_other` plural forms, and
 * `{{ variable }}` interpolation.
 *
 * Components pass their English copy as an inline default, so this returns real copy without
 * any test needing to know the key. Falling back to the key (i18next's behaviour for a key with
 * no default) is the last resort.
 */
export const mockT = (
  key: string,
  second?: string | TOptions,
  third?: TOptions,
): string => {
  const defaultValue = typeof second === 'string' ? second : undefined;
  const options: TOptions = (typeof second === 'object' ? second : third) ?? {};

  // This key is resolved by an i18next postProcessor rather than a plain lookup: its value is
  // `{{value, notification}}`, and the notification topic renders the notification's message.
  // Model that here so components using it are testable without a real i18next instance.
  if (key === 'translationBuilderTopic.notification') {
    return (options.value as string | undefined) ?? '';
  }

  let template = defaultValue;
  if (template === undefined && typeof options.count === 'number') {
    template =
      options.count === 1 ? options.defaultValue_one : options.defaultValue_other;
  }
  template ??= options.defaultValue;
  template ??= key;

  return interpolate(template, options);
};

export const mockTranslationContext = {
  t: mockT,
};
