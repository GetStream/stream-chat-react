import type { PropsWithChildren } from 'react';
import type { UnsupportedAttachmentPreviewProps } from 'stream-chat-react';
import {
  AttachmentPreviewList,
  UnsupportedAttachmentPreview,
  useComponentContextIcons,
  WithComponents,
} from 'stream-chat-react';
import './CustomAttachmentPreviewList.css';

const EventOrUnsupportedPreview = (props: UnsupportedAttachmentPreviewProps) => {
  const { IconXmarkSmall } = useComponentContextIcons();
  const { attachment, removeAttachments } = props;

  if (attachment.type !== 'event') {
    return <UnsupportedAttachmentPreview {...props} />;
  }

  return (
    <div className='cookbook-event-preview'>
      <span className='cookbook-event-preview__title'>📅 {attachment.title}</span>
      <button
        aria-label='Remove event'
        className='cookbook-event-preview__remove'
        onClick={() => removeAttachments([attachment.localMetadata.id])}
        type='button'
      >
        <IconXmarkSmall />
      </button>
    </div>
  );
};

export const CustomAttachmentPreviewList = () => (
  <AttachmentPreviewList UnsupportedAttachmentPreview={EventOrUnsupportedPreview} />
);

const overrides = { AttachmentPreviewList: CustomAttachmentPreviewList };

export const WithEventPreviews = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
