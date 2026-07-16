import { CategoryNav } from './CategoryNav';
import { EmojiGrid } from './EmojiGrid';
import { EmojiPickerRoot, type EmojiPickerRootProps } from './EmojiPickerRoot';
import { PreviewPane } from './PreviewPane';
import { SearchInput } from './SearchInput';
import { SkinToneSelector } from './SkinToneSelector';

export type EmojiPickerPanelProps = Omit<EmojiPickerRootProps, 'children'> & {
  /** Focus the search input when the panel mounts (default `true`). */
  autoFocus?: boolean;
};

/**
 * The batteries-included emoji picker panel: `EmojiPickerRoot` wired to the standard slot
 * arrangement (category nav, search, grid, then a footer with the preview and skin-tone
 * selector). This is the default composition `StreamEmojiPicker` renders; for a custom
 * layout, render `StreamEmojiPicker.Root` with your own arrangement of slots instead.
 */
export const EmojiPickerPanel = (props: EmojiPickerPanelProps) => (
  <EmojiPickerRoot {...props}>
    <CategoryNav />
    <SearchInput autoFocus={props.autoFocus} />
    <EmojiGrid />
    <div className='str-chat__emoji-picker__footer'>
      <PreviewPane />
      <SkinToneSelector />
    </div>
  </EmojiPickerRoot>
);
