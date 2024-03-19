export const mockTranslatorFunction = (value, params = {}) =>
  Object.keys(params).reduce((acc, key) => {
    const regexp = new RegExp(`\\{\\{\\s${key}\\s\\}\\}`, 'g');
    return acc.replace(regexp, params[key]);
  }, value);

export const mockTranslationContext = {
  // Mock translation function that always falls back to the key.
  // It also handles nested keys, e.g. 'aria/Send' will fall back to 'Send'.
  t: (key) => key.split('/').pop(),
};
