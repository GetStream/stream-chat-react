/**
 * Guard for context hooks whose provider is mandatory. Returns the context value, or throws a
 * consistently shaped error naming the hook and the provider the caller is missing.
 *
 * Only for required contexts. Contexts with a meaningful default — `ComponentContext`,
 * `TranslationContext`, `WorkspaceNavigationContext`, … — must return that default instead, so that
 * components relying on it keep rendering outside a provider.
 *
 * Guards on `undefined` rather than falsiness so that a context legitimately holding `null`, `0` or
 * `''` is not misdiagnosed as missing.
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
