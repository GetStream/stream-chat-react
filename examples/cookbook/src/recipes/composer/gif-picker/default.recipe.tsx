import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { DemoGifShots } from './DemoGifShots';
import { WithGifPicker } from './WithGifPicker';

// A GIF button next to the composer's input. The base app's channels view renders the channel,
// so the wrapper goes around it; GifChannel.tsx is the same wrapper around a channel of your own.
// DemoGifShots only serves the screenshots.
const Wrapper = ({ children }: PropsWithChildren) => (
  <WithGifPicker>
    <DemoGifShots />
    {children}
  </WithGifPicker>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
