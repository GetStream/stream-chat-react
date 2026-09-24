import React from 'react';
import { render } from '@testing-library/react';

import { FileAttachment } from '../FileAttachment';
import { ChatProvider, TranslationProvider } from '../../../context';
import { mockChatContext, mockTranslationContextValue } from '../../../mock-builders';

const getComponent = ({ attachment }: any) => (
  <ChatProvider value={mockChatContext()}>
    <TranslationProvider value={mockTranslationContextValue()}>
      <FileAttachment attachment={attachment} />
    </TranslationProvider>
  </ChatProvider>
);

const file = {
  asset_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  // v10: file_size / mime_type are not top-level Attachment fields anymore, they live
  // under `attachment.custom`.
  custom: {
    file_size: 1337,
    mime_type: 'application/pdf',
  },
  text: 'My file',
  title: 'Nice file',
  type: 'file',
};

describe('File', () => {
  it('should render File component', () => {
    const { container } = render(getComponent({ attachment: file }));
    expect(container).toMatchSnapshot();
  });
});
