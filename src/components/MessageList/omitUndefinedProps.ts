/**
 * Keeps only the props that are set. A component override that sets a prop and then spreads its
 * props (`<Message showAvatar {...props} />`) keeps its own value.
 */
export const omitUndefinedProps = <Props extends object>(props: Props = {} as Props) =>
  Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as Partial<Props>;
