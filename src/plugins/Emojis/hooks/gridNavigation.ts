export type GridPosition = { index: number; section: number };

/**
 * Pure keyboard navigation over a sectioned grid: the emoji picker is a vertical stack
 * of sections (categories), each laid out as a `columns`-wide grid filled in reading
 * order. Given the section lengths, the active `(section, index)`, the pressed key, and
 * the current column count, it returns the target position — or `null` to stay put at a
 * grid edge.
 *
 * Kept free of the DOM so the (otherwise layout-dependent, untestable) navigation logic
 * can be unit-tested exhaustively. The hook maps the DOM position in/out and measures
 * `columns` from layout.
 */
export const navigateGrid = (
  sectionLengths: number[],
  pos: GridPosition,
  key: string,
  columns: number,
): GridPosition | null => {
  const cols = Math.max(1, columns);
  const len = sectionLengths[pos.section] ?? 0;
  if (len === 0) return null;

  const col = pos.index % cols;
  const row = Math.floor(pos.index / cols);
  const lastRow = Math.floor((len - 1) / cols);

  switch (key) {
    case 'Home':
      return { index: 0, section: 0 };

    case 'End': {
      const last = sectionLengths.length - 1;
      return { index: Math.max(0, (sectionLengths[last] ?? 0) - 1), section: last };
    }

    case 'ArrowRight':
      if (pos.index < len - 1) return { index: pos.index + 1, section: pos.section };
      if (pos.section < sectionLengths.length - 1) {
        return { index: 0, section: pos.section + 1 };
      }
      return null;

    case 'ArrowLeft':
      if (pos.index > 0) return { index: pos.index - 1, section: pos.section };
      if (pos.section > 0) {
        return {
          index: Math.max(0, (sectionLengths[pos.section - 1] ?? 0) - 1),
          section: pos.section - 1,
        };
      }
      return null;

    case 'ArrowDown':
      if (row < lastRow) {
        return { index: Math.min(pos.index + cols, len - 1), section: pos.section };
      }
      if (pos.section < sectionLengths.length - 1) {
        const nextLen = sectionLengths[pos.section + 1] ?? 0;
        if (nextLen === 0) return null;
        return { index: Math.min(col, nextLen - 1), section: pos.section + 1 };
      }
      return null;

    case 'ArrowUp':
      if (row > 0) return { index: pos.index - cols, section: pos.section };
      if (pos.section > 0) {
        const prevLen = sectionLengths[pos.section - 1] ?? 0;
        if (prevLen === 0) return null;
        const prevLastRow = Math.floor((prevLen - 1) / cols);
        return {
          index: Math.min(prevLastRow * cols + col, prevLen - 1),
          section: pos.section - 1,
        };
      }
      return null;

    default:
      return null;
  }
};
