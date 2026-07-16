/**
 * @deprecated No longer required. The built-in emoji search index self-initializes,
 * so this is a no-op kept only so existing `init({ data })` calls keep compiling and
 * running while migrating away from `emoji-mart`. Safe to remove from your app.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const init = (_options?: unknown): void => {
  // intentionally empty — kept for backwards compatibility only
};
