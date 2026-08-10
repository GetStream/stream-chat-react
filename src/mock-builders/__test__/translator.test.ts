import { mockT } from '../translator';

describe('mockT', () => {
  it('falls back to the key when no default is given', () => {
    expect(mockT('some.key')).toStrictEqual('some.key');
  });

  it('returns the positional defaultValue', () => {
    expect(mockT('messageComposer.sendButton.label', 'Send Message')).toStrictEqual(
      'Send Message',
    );
  });

  it('inserts a single param value', () => {
    expect(mockT('a.key', '{{ testKey }}', { testKey: 'test' })).toStrictEqual('test');
  });

  it('inserts multiple param values', () => {
    const result = mockT('a.key', '{{ testKey1 }}, {{ testKey2 }}, and {{ testKey3 }}', {
      testKey1: 'test1',
      testKey2: 'test2',
      testKey3: 'test3',
    });
    expect(result).toStrictEqual('test1, test2, and test3');
  });

  it('leaves an unmatched placeholder in place', () => {
    expect(mockT('a.key', 'Hello {{ name }}', {})).toStrictEqual('Hello {{ name }}');
  });

  it('picks the plural form matching count', () => {
    const options = {
      defaultValue_one: '{{ count }} member',
      defaultValue_other: '{{ count }} members',
    };
    expect(mockT('channel.memberCount', { ...options, count: 1 })).toStrictEqual(
      '1 member',
    );
    expect(mockT('channel.memberCount', { ...options, count: 4 })).toStrictEqual(
      '4 members',
    );
  });

  it('accepts options as the second argument', () => {
    expect(mockT('a.key', { defaultValue: 'Hi {{ name }}', name: 'Ada' })).toStrictEqual(
      'Hi Ada',
    );
  });
});
