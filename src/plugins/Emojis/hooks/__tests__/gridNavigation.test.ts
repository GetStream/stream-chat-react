import { navigateGrid } from '../gridNavigation';

// A "grid" is a vertical stack of sections (categories); each section is laid out as a
// `columns`-wide grid filled in reading order. navigateGrid is pure: given the section
// lengths, the active (section, index), a key, and the column count, it returns the
// target position (or null to stay put at a grid edge).

describe('navigateGrid — single section (search view)', () => {
  const single = [7]; // rows (cols=3): [0,1,2] [3,4,5] [6]

  it('moves right/left within a row', () => {
    expect(navigateGrid(single, { index: 0, section: 0 }, 'ArrowRight', 3)).toEqual({
      index: 1,
      section: 0,
    });
    expect(navigateGrid(single, { index: 1, section: 0 }, 'ArrowLeft', 3)).toEqual({
      index: 0,
      section: 0,
    });
  });

  it('clamps (null) at the last cell going right and the first going left', () => {
    expect(navigateGrid(single, { index: 6, section: 0 }, 'ArrowRight', 3)).toBeNull();
    expect(navigateGrid(single, { index: 0, section: 0 }, 'ArrowLeft', 3)).toBeNull();
  });

  it('moves down/up by one row, same column', () => {
    expect(navigateGrid(single, { index: 1, section: 0 }, 'ArrowDown', 3)).toEqual({
      index: 4,
      section: 0,
    });
    expect(navigateGrid(single, { index: 4, section: 0 }, 'ArrowUp', 3)).toEqual({
      index: 1,
      section: 0,
    });
  });

  it('down into a partial last row clamps to that row’s last cell', () => {
    // index 5 (row 1, col 2) down: row 2 has only index 6 → clamp to 6.
    expect(navigateGrid(single, { index: 5, section: 0 }, 'ArrowDown', 3)).toEqual({
      index: 6,
      section: 0,
    });
  });

  it('clamps (null) going down from the last row and up from the first', () => {
    expect(navigateGrid(single, { index: 6, section: 0 }, 'ArrowDown', 3)).toBeNull();
    expect(navigateGrid(single, { index: 2, section: 0 }, 'ArrowUp', 3)).toBeNull();
  });

  it('Home/End jump to the first/last cell of the whole grid', () => {
    expect(navigateGrid(single, { index: 5, section: 0 }, 'Home', 3)).toEqual({
      index: 0,
      section: 0,
    });
    expect(navigateGrid(single, { index: 0, section: 0 }, 'End', 3)).toEqual({
      index: 6,
      section: 0,
    });
  });
});

describe('navigateGrid — multiple sections (category view)', () => {
  const multi = [5, 6]; // section 0 rows (cols=3): [0,1,2] [3,4]; section 1: [0,1,2] [3,4,5]

  it('crosses to the next section going right off a section’s last cell', () => {
    expect(navigateGrid(multi, { index: 4, section: 0 }, 'ArrowRight', 3)).toEqual({
      index: 0,
      section: 1,
    });
  });

  it('crosses to the previous section going left off a section’s first cell', () => {
    expect(navigateGrid(multi, { index: 0, section: 1 }, 'ArrowLeft', 3)).toEqual({
      index: 4,
      section: 0,
    });
  });

  it('crosses down into the next section preserving the column', () => {
    expect(navigateGrid(multi, { index: 3, section: 0 }, 'ArrowDown', 3)).toEqual({
      index: 0,
      section: 1,
    });
    expect(navigateGrid(multi, { index: 4, section: 0 }, 'ArrowDown', 3)).toEqual({
      index: 1,
      section: 1,
    });
  });

  it('crosses up into the previous section’s last row, clamping the column', () => {
    expect(navigateGrid(multi, { index: 1, section: 1 }, 'ArrowUp', 3)).toEqual({
      index: 4,
      section: 0,
    });
    // Column 2 has no cell in section 0's last row ([3,4]) → clamp to its last cell.
    expect(navigateGrid(multi, { index: 2, section: 1 }, 'ArrowUp', 3)).toEqual({
      index: 4,
      section: 0,
    });
  });

  it('clamps (null) going right off the very last cell of the last section', () => {
    expect(navigateGrid(multi, { index: 5, section: 1 }, 'ArrowRight', 3)).toBeNull();
  });

  it('End jumps to the last cell of the last section', () => {
    expect(navigateGrid(multi, { index: 0, section: 0 }, 'End', 3)).toEqual({
      index: 5,
      section: 1,
    });
  });
});
