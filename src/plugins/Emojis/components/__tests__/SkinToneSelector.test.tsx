import { fireEvent, render, screen } from '@testing-library/react';
import { SKIN_TONES } from '../skinTones';

const { ctx } = vi.hoisted(() => ({
  ctx: {
    setSkinTone: vi.fn(),
    skinToneIndex: 0,
    skinTones: [] as { glyph: string; labelKey: string }[],
  },
}));
vi.mock('../../context/EmojiPickerContext', () => ({
  useEmojiPickerContext: () => ctx,
}));
vi.mock('../../../../context', () => ({
  useTranslationContext: () => ({ t: (key: string) => key }),
}));

import { SkinToneSelector } from '../SkinToneSelector';

const setup = (skinToneIndex: number) => {
  ctx.skinToneIndex = skinToneIndex;
  ctx.skinTones = SKIN_TONES;
  vi.spyOn(ctx, 'setSkinTone').mockImplementation();
  return ctx.setSkinTone;
};

const openGroup = () =>
  fireEvent.click(screen.getByRole('button', { name: 'aria/Choose default skin tone' }));

describe('SkinToneSelector radiogroup keyboard navigation', () => {
  it('moves focus to the checked tone when the group opens, with roving tabindex', () => {
    setup(2);
    render(<SkinToneSelector />);
    openGroup();

    const radios = screen.getAllByRole('radio');
    expect(radios[2]).toHaveFocus();
    expect(radios[2]).toHaveAttribute('tabindex', '0');
    expect(radios[0]).toHaveAttribute('tabindex', '-1');
  });

  it('moves the selection with Arrow/Home/End keys (selection follows focus)', () => {
    const setSkinTone = setup(0);
    render(<SkinToneSelector />);
    openGroup();

    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(setSkinTone).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(setSkinTone).toHaveBeenLastCalledWith(5); // wraps from 0 to the last tone
    fireEvent.keyDown(group, { key: 'End' });
    expect(setSkinTone).toHaveBeenLastCalledWith(5);
    fireEvent.keyDown(group, { key: 'Home' });
    expect(setSkinTone).toHaveBeenLastCalledWith(0);
  });

  it('collapses on Escape without bubbling to close the whole picker', () => {
    setup(0);
    const onOuterKeyDown = vi.fn();
    render(
      <div onKeyDown={onOuterKeyDown}>
        <SkinToneSelector />
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
