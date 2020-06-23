import React from 'react';
import { FileIcon } from 'react-file-utils';
import prettybytes from 'pretty-bytes';
import { SafeAnchor } from '../SafeAnchor';

const File = ({ attachment: a }) => {
  return (
    <div
      data-testid="attachment-file"
      className="str-chat__message-attachment-file--item"
    >
      <FileIcon
        mimeType={a.mime_type}
        filename={a.title}
        big={true}
        size={30}
      />
      <div className="str-chat__message-attachment-file--item-text">
        <SafeAnchor href={a.asset_url} target="_blank" download>
          {a.title}
        </SafeAnchor>
        {a.file_size && <span>{prettybytes(a.file_size)}</span>}
      </div>
    </div>
  );
};

export default React.memo(File);
