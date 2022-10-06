export const deprecationAndReplacementWarning = <P extends Record<string, unknown>[][]>(
  pairs: P,
  component: string,
) => {
  pairs.forEach((data) => {
    const [[oldName, oldValue], [newName, newValue]] = [
      Object.entries(data[0])[0],
      Object.entries(data[1])[0],
    ];

    if (
      (typeof oldValue !== 'undefined' && typeof newValue === 'undefined') ||
      (typeof oldValue !== 'undefined' && typeof newValue !== 'undefined')
    ) {
      console.warn(
        `[Deprecation notice (${component})]: prefer using prop ${newName} instead of ${oldName}`,
      );
    }
  });
};
