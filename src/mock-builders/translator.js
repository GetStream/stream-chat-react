export const mockTranslatorFunction = (value, params = {}) =>
  Object.keys(params).reduce((acc, key) => {
    const regexp = new RegExp(`\\{\\{\\s${key}\\s\\}\\}`, 'g');
    return acc.replace(regexp, params[key]);
  }, value);
