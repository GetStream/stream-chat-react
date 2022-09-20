import React from 'react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';

import { FileAttachment } from '../FileAttachment';

import { ChatContext } from '../../../context/ChatContext';

const getComponent = ({ attachment, chatContext }) => (
  <ChatContext.Provider value={chatContext}>
    <FileAttachment attachment={attachment} />
  </ChatContext.Provider>
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
  it.each([['1'], ['2']])('should render File component in V%s', (themeVersion) => {
    const tree = renderer
      .create(getComponent({ attachment: file, chatContext: { themeVersion } }))
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
