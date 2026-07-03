import { memoizeAsyncWithReset } from '../memoizeAsyncWithReset';

describe('memoizeAsyncWithReset', () => {
  it('memoizes a successful result so the factory runs once', async () => {
    let calls = 0;
    const memoized = memoizeAsyncWithReset(() => {
      calls += 1;
      return Promise.resolve('data');
    });

    await expect(memoized()).resolves.toBe('data');
    await expect(memoized()).resolves.toBe('data');
    expect(calls).toBe(1);
  });

  it('shares a single in-flight promise between concurrent callers', async () => {
    let calls = 0;
    const memoized = memoizeAsyncWithReset(() => {
      calls += 1;
      return Promise.resolve('data');
    });

    await Promise.all([memoized(), memoized()]);
    expect(calls).toBe(1);
  });

  it('resets after a rejection so the next call retries instead of replaying the failure', async () => {
    let calls = 0;
    const memoized = memoizeAsyncWithReset(() => {
      calls += 1;
      return calls === 1
        ? Promise.reject(new Error('chunk load failed'))
        : Promise.resolve('data');
    });

    await expect(memoized()).rejects.toThrow('chunk load failed');
    // A memoized rejection would replay forever; the reset must let the retry succeed.
    await expect(memoized()).resolves.toBe('data');
    expect(calls).toBe(2);
  });
});
