import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../../../context', () => ({
  useTranslationContext: () => ({ t: (key: string) => key }),
}));

import { SkinToneSelector } from '../SkinToneSelector';

const openGroup = () =>
  fireEvent.click(screen.getByRole('button', { name: 'aria/Choose default skin tone' }));

describe('SkinToneSelector radiogroup keyboard navigation', () => {
  it('moves focus to the checked tone when the group opens, with roving tabindex', () => {
    render(<SkinToneSelector onSelect={vi.fn()} skinToneIndex={2} />);
    openGroup();

    const radios = screen.getAllByRole('radio');
    expect(radios[2]).toHaveFocus();
    expect(radios[2]).toHaveAttribute('tabindex', '0');
    expect(radios[0]).toHaveAttribute('tabindex', '-1');
  });

  it('selects the next/previous tone with arrow keys (selection follows focus)', () => {
    const onSelect = vi.fn();
    render(<SkinToneSelector onSelect={onSelect} skinToneIndex={0} />);
    openGroup();

    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(onSelect).toHaveBeenLastCalledWith(5); // wraps from 0 to the last tone
  });

  it('jumps to the first/last tone with Home/End', () => {
    const onSelect = vi.fn();
    render(<SkinToneSelector onSelect={onSelect} skinToneIndex={2} />);
    openGroup();

    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, { key: 'End' });
    expect(onSelect).toHaveBeenLastCalledWith(5);
    fireEvent.keyDown(group, { key: 'Home' });
    expect(onSelect).toHaveBeenLastCalledWith(0);
  });

  it('collapses on Escape without bubbling to close the whole picker', () => {
    const onOuterKeyDown = vi.fn();
    render(
      <div onKeyDown={onOuterKeyDown}>
        <SkinToneSelector onSelect={vi.fn()} skinToneIndex={0} />
      </div>,
    );
    openGroup();

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'Escape' });

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'aria/Choose default skin tone' }),
    ).toBeInTheDocument();
    // Escape stayed inside the selector — it must not reach the picker's Escape handler.
    expect(onOuterKeyDown).not.toHaveBeenCalled();
  });
});
