import React from 'react';
import prettybytes from 'pretty-bytes';
import { FileIcon } from 'react-file-utils';

import { SafeAnchor } from '../SafeAnchor';

import type { Attachment } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type FileAttachmentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  attachment: Attachment<StreamChatGenerics>;
};

const UnMemoizedFileAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: FileAttachmentProps<StreamChatGenerics>,
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
          <span>{prettybytes(attachment.file_size as number)}</span>
        )}
      </div>
    </div>
  );
};

export const FileAttachment = React.memo(
  UnMemoizedFileAttachment,
) as typeof UnMemoizedFileAttachment;
