import React from 'react';

import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading/LoadingIndicator';
import { useComponentContext } from '../../context/ComponentContext';

export type MessageListPositioningUIProps = {
  /**
   * True while react-virtuoso keeps the list hidden to position it: when the list opens (a channel
   * or thread, a channel switch) and after a jump to a message or to the latest messages, for about
   * a quarter of a second. False otherwise, so a component can animate the change (fade the list
   * in, say).
   */
  isPositioning: boolean;
};

/**
 * Rendered over `VirtualizedMessageList` at all times, told whether the list is being positioned.
 * The default shows the `LoadingIndicator`, centered, while it is; a `LoadingIndicator` set to
 * `null` turns it off. Replace it through the `MessageListPositioningUI` key of `WithComponents`,
 * or set that key to `null` to render nothing.
 */
export const MessageListPositioningUI = ({
  isPositioning,
}: MessageListPositioningUIProps) => {
  // The default applies only to an unset key, so `null` stays `null` and hides the spinner.
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext();
  if (!isPositioning || !LoadingIndicator) return null;
  return (
    <div className='str-chat__virtual-list__positioning'>
      <LoadingIndicator />
    </div>
  );
};
