/**
 * Guard for context hooks whose provider is mandatory: returns the value, or throws an error naming
 * the hook and the missing provider. Contexts with a meaningful default return that default
 * instead, so their components keep rendering outside a provider.
 *
 * Compares against `undefined` so a context legitimately holding `null`, `0` or `''` still counts
 * as present.
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
