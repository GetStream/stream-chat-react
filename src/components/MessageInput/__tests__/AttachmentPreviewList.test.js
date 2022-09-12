/* eslint-disable jest-dom/prefer-in-document */

import React from 'react';

import { fireEvent, render } from '@testing-library/react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';

import { AttachmentPreviewList } from '../AttachmentPreviewList';
import { MessageInputContextProvider } from '../../../context/MessageInputContext';

import { generateUpload } from '../../../mock-builders';

const uploadsReducer = (pv, cv) => {
  pv[cv.id] = cv;
  return pv;
};

/**
 * @param {string} word
 * @returns string
 */
const capitalize = ([firstLetter, ...restOfTheWord]) =>
  `${firstLetter.toUpperCase()}${restOfTheWord.join('')}`;

const orderMapper = ({ id }) => id;

const generateMessageInputContextValue = ({ files = [], images = [] } = {}) => ({
  fileOrder: files.map(orderMapper),
  fileUploads: files.reduce(uploadsReducer, {}),
  imageOrder: images.map(orderMapper),
  imageUploads: images.reduce(uploadsReducer, {}),
  removeFile: jest.fn(),
  removeImage: jest.fn(),
  uploadFile: jest.fn(),
  uploadImage: jest.fn(),
});

const renderComponent = (value = {}, renderFunction = render) =>
  renderFunction(
    <MessageInputContextProvider value={{ ...generateMessageInputContextValue(), ...value }}>
      <AttachmentPreviewList />
    </MessageInputContextProvider>,
  );

jest.mock('nanoid', () => ({
  nanoid: () => '<randomNanoId>',
}));

describe('AttachmentPreviewList', () => {
  it('renders without any attachments', () => {
    const { getByTestId } = renderComponent();

    const attachmentList = getByTestId('attachment-list-scroll-container');

    expect(attachmentList).toBeEmptyDOMElement();
  });

  it.each(['uploading', 'failed', 'finished'])(
    'renders with one image and one file with state "%s"',
    (state) => {
      const [file, image] = [
        generateUpload({
          fileOverrides: { name: 'file-upload' },
          objectOverrides: { state },
        }),
        generateUpload({
          fileOverrides: { name: 'image-upload', type: 'image' },
          objectOverrides: { state },
        }),
      ];

      const tree = renderComponent(
        generateMessageInputContextValue({ files: [file], images: [image] }),
        renderer.create,
      ).toJSON();

      expect(tree).toMatchSnapshot();
    },
  );

  it.each(['file', 'image'])('tests "retry" click on %s upload', (type) => {
    const file = generateUpload({
      fileOverrides: { type },
      objectOverrides: { state: 'failed' },
    });

    const contextValue = generateMessageInputContextValue({ [`${type}s`]: [file] });

    const { getByTestId } = renderComponent(contextValue);

    const retryButton = getByTestId(`${type}-preview-item-retry-button`);

    fireEvent.click(retryButton);

    expect(contextValue[`upload${capitalize(type)}`]).toHaveBeenCalledWith(file.id);
  });

  it.each(['file', 'image'])('tests "remove" click on %s upload', (type) => {
    const file = generateUpload({
      fileOverrides: { type },
      objectOverrides: { state: 'finished' },
    });

    const contextValue = generateMessageInputContextValue({ [`${type}s`]: [file] });

    const { getByTestId } = renderComponent(contextValue);

    const deleteButton = getByTestId(`${type}-preview-item-delete-button`);

    fireEvent.click(deleteButton);

    expect(contextValue[`remove${capitalize(type)}`]).toHaveBeenCalledWith(file.id);
  });
});
