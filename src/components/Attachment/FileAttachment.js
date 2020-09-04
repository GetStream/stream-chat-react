import React from 'react';
import { FileIcon } from 'react-file-utils';
import prettybytes from 'pretty-bytes';
import { SafeAnchor } from '../SafeAnchor';

/** @type React.FC<import('types').FileAttachmentProps> */
const FileAttachment = ({ attachment }) => {
  return (
    <div
      data-testid="attachment-file"
      className="str-chat__message-attachment-file--item"
    >
      <FileIcon
        mimeType={attachment.mime_type}
        filename={attachment.title}
        big={true}
        size={30}
      />
      <div className="str-chat__message-attachment-file--item-text">
        <SafeAnchor href={attachment.asset_url} target="_blank" download>
          {attachment.title}
        </SafeAnchor>
        {attachment.file_size && (
          <span>{prettybytes(attachment.file_size)}</span>
        )}
      </div>
    </div>
  );
};

export default React.memo(FileAttachment);
