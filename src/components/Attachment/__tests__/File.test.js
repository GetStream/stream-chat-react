import React from 'react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';
import { FileAttachment } from '../FileAttachment';

const getComponent = (attachment) => <FileAttachment attachment={attachment} />;

describe('File', () => {
  it('should render File component', () => {
    const file = {
      asset_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_size: 1337,
      mime_type: 'application/pdf',
      text: 'My file',
      title: 'Nice file',
      type: 'file',
    };
    const tree = renderer.create(getComponent(file)).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
