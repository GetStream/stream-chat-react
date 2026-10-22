import React from 'react';
import { render } from '@testing-library/react';

import { FileIcon, mimeTypeToIcon } from '../FileIcon';

const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLSB_MIME_TYPE = 'application/vnd.ms-excel.sheet.binary.macroEnabled.12';

describe('FileIcon', () => {
  it('shows the spreadsheet icon for an .xlsb file', () => {
    expect(mimeTypeToIcon(XLSB_MIME_TYPE)).toBe(mimeTypeToIcon(XLSX_MIME_TYPE));
    expect(mimeTypeToIcon(XLSB_MIME_TYPE)).not.toBe(mimeTypeToIcon());
  });

  it('labels an .xlsb file by its MIME type', () => {
    const { container } = render(
      <FileIcon fileName='report.bin' mimeType={XLSB_MIME_TYPE} />,
    );
    expect(container).toHaveTextContent('xlsb');
  });
});
