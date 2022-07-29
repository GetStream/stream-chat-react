import { mockTranslatorFunction } from '../translator';

describe('mockTranslatorFunction', () => {
  it('returns string if no map passed in as second argument', () => {
    const result = mockTranslatorFunction('');
    expect(result).toStrictEqual('');
  });
  it('inserts a single param value', () => {
    const result = mockTranslatorFunction('{{ testKey }}', { testKey: 'test' });
    expect(result).toStrictEqual('test');
  });
  it('inserts multiple param values', () => {
    const result = mockTranslatorFunction('{{ testKey1 }}, {{ testKey2 }}, and {{ testKey3 }}', {
      testKey1: 'test1',
      testKey2: 'test2',
      testKey3: 'test3',
    });
    expect(result).toStrictEqual('test1, test2, and test3');
  });
});
