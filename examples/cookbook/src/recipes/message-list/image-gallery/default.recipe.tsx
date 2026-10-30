import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { OpenLightboxFromUrl } from './OpenLightboxFromUrl';
import { WithImageGallery } from './WithImageGallery';

// A custom image grid and a lightbox with a thumbnail strip, keyboard and swipe navigation,
// captions and videos. OpenLightboxFromUrl only serves the screenshots.
const Wrapper = ({ children }: PropsWithChildren) => (
  <WithImageGallery>
    <OpenLightboxFromUrl />
    {children}
  </WithImageGallery>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
