import React from 'react';
import { render } from '@testing-library/react';

import { FileAttachment } from '../FileAttachment';
import { TranslationProvider } from '../../../context';
import { mockTranslationContextValue } from '../../../mock-builders';

const getComponent = ({ attachment }: any) => (
  <TranslationProvider value={mockTranslationContextValue()}>
    <FileAttachment attachment={attachment} />
  </TranslationProvider>
);

const file = {
  asset_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  file_size: 1337,
  mime_type: 'application/pdf',
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
