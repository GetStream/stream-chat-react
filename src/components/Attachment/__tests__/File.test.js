import React from 'react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';

import { FileAttachment } from '../FileAttachment';
import { TranslationContext } from '../../../context';
import { mockTranslationContext } from '../../../mock-builders';

const getComponent = ({ attachment }) => (
  <TranslationContext.Provider value={mockTranslationContext}>
    <FileAttachment attachment={attachment} />
  </TranslationContext.Provider>
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
    const tree = renderer.create(getComponent({ attachment: file })).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
