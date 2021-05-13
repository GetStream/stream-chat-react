import React from 'react';
import prettybytes from 'pretty-bytes';
import { FileIcon } from 'react-file-utils';

import { SafeAnchor } from '../SafeAnchor';

import type { Attachment } from 'stream-chat';

import type { DefaultAttachmentType } from '../../types/types';

export type FileAttachmentProps<At extends DefaultAttachmentType = DefaultAttachmentType> = {
  attachment: Attachment<At>;
};

const UnMemoizedFileAttachment = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  props: FileAttachmentProps<At>,
) => {
  const { attachment } = props;

  return (
    <div className='str-chat__message-attachment-file--item' data-testid='attachment-file'>
      <FileIcon big={true} filename={attachment.title} mimeType={attachment.mime_type} size={30} />
      <div className='str-chat__message-attachment-file--item-text'>
        <SafeAnchor download href={attachment.asset_url} target='_blank'>
          {attachment.title}
        </SafeAnchor>
        {attachment.file_size && Number.isFinite(Number(attachment.file_size)) && (
          <span>{prettybytes(attachment.file_size)}</span>
        )}
      </div>
    </div>
  );
};

export const FileAttachment = React.memo(
  UnMemoizedFileAttachment,
) as typeof UnMemoizedFileAttachment;
