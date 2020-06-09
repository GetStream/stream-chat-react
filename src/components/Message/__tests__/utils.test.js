import { validateAndGetMessage } from '../utils';

describe('Message utils', () => {
  it('should return null if called without a function as the first parameter', () => {
    const result = validateAndGetMessage({}, 'Message');
    expect(result).toBeNull();
  });

  it('should return null if result of function call is not a string', () => {
    const fn = () => null;
    const result = validateAndGetMessage(fn, 'something');
    expect(result).toBeNull();
  });

  it('should return the result of the function call when it is a string', () => {
    const fn = (msg) => msg;
    const message = 'message';
    const result = validateAndGetMessage(fn, [message]);
    expect(result).toBe(message);
  });
});
