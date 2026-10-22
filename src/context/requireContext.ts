/**
 * Guard for context hooks whose provider is mandatory: returns the value, or throws an error naming
 * the hook and the missing provider. Only `undefined` counts as missing, so `null`, `0` and `''`
 * pass.
 */
export const requireContext = <T>(
  value: T | undefined,
  hookName: string,
  providerName: string,
): T => {
  if (value === undefined) {
    throw new Error(
      `${hookName} was called outside of ${providerName}. Make sure the component calling ` +
        `${hookName} is rendered within <${providerName}>.`,
    );
  }

  return value;
};
