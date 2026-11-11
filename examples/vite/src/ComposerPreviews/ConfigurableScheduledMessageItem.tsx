import { ScheduledMessageItem, type ScheduledMessageItemProps } from 'stream-chat-react';

import { useAppSettingsSelector } from '../AppSettings';

/**
 * Without the Scheduled message preview (Settings -> Composer), the composer could not show or
 * cancel a scheduled message opened in it, so the list offers no Edit or Retry.
 */
export const ConfigurableScheduledMessageItem = ({
  onEdit,
  ...props
}: ScheduledMessageItemProps) => {
  const { disabledPreviewSections } = useAppSettingsSelector((state) => state.composer);

  return (
    <ScheduledMessageItem
      {...props}
      onEdit={disabledPreviewSections.includes('scheduledMessage') ? undefined : onEdit}
    />
  );
};
