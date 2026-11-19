// How a tool call's arguments read for people. Not exported from the package: `AIToolArguments`
// and `AIToolApprover.argumentsPreview` are how an app shows or formats them.

/** A call's arguments as people read them: JSON, indented, or `undefined` when there are none. */
export const formatToolArguments = (args: unknown): string | undefined => {
  if (args === undefined || args === null || args === '') return undefined;
  if (typeof args === 'object' && Object.keys(args).length === 0) return undefined;
  if (typeof args === 'string') {
    try {
      return formatToolArguments(JSON.parse(args) as unknown);
    } catch {
      return args;
    }
  }
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
};
