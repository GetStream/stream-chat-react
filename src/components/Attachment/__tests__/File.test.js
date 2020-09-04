import React from 'react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';
import FileAttachment from '../FileAttachment';

const getComponent = (attachment) => {
  return <FileAttachment attachment={attachment} />;
};

describe('File', () => {
  it('should render File component', () => {
    const file = {
      type: 'file',
      mime_type: 'application/pdf',
      title: 'Nice file',
      asset_url:
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_size: 1337,
      text: 'My file',
    };
    const tree = renderer.create(getComponent(file)).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
