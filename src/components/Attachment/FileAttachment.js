import React from 'react';
import { FileIcon } from 'react-file-utils';
import prettybytes from 'pretty-bytes';
import { SafeAnchor } from '../SafeAnchor';

/** @type React.FC<import('types').FileAttachmentProps> */
const FileAttachment = ({ attachment }) => (
  <div
    className='str-chat__message-attachment-file--item'
    data-testid='attachment-file'
  >
    <FileIcon
      big={true}
      filename={attachment.title}
      mimeType={attachment.mime_type}
      size={30}
    />
    <div className='str-chat__message-attachment-file--item-text'>
      <SafeAnchor download href={attachment.asset_url} target='_blank'>
        {attachment.title}
      </SafeAnchor>
      {attachment.file_size &&
        Number.isFinite(Number(attachment.file_size)) && (
          <span>{prettybytes(attachment.file_size)}</span>
        )}
    </div>
  </div>
);

export default React.memo(FileAttachment);
