/* eslint-disable jest-dom/prefer-in-document */

import React from 'react';

import { fireEvent, render } from '@testing-library/react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';

import { AttachmentPreviewList } from '../AttachmentPreviewList';
import { MessageInputContextProvider } from '../../../context';

import {
  generateMessageComposerFileAttachment,
  generateMessageComposerImageAttachment,
} from '../../../mock-builders';

/**
 * @param {string} word
 * @returns string
 */
const capitalize = ([firstLetter, ...restOfTheWord]) =>
  `${firstLetter.toUpperCase()}${restOfTheWord.join('')}`;

const generateMessageInputContextValue = ({ attachments = [] } = {}) => ({
  attachments,
  removeAttachment: jest.fn(),
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
    (uploadState) => {
      const attachments = [
        generateMessageComposerFileAttachment({
          fileOverrides: { name: 'file-name' },
          objectOverrides: { id: 'file-attachment', uploadState },
        }),
        generateMessageComposerImageAttachment({
          fileOverrides: { name: 'image-name' },
          objectOverrides: { id: 'image-attachment', uploadState },
        }),
      ];

      const tree = renderComponent(
        generateMessageInputContextValue({ attachments }),
        renderer.create,
      ).toJSON();

      expect(tree).toMatchSnapshot();
    },
  );

  it.each(['file', 'image'])('retries to upload %s when retry button is clicked', (type) => {
    const objectOverrides = { uploadState: 'failed' };
    const file =
      type === 'image'
        ? generateMessageComposerImageAttachment({ objectOverrides })
        : generateMessageComposerFileAttachment({ objectOverrides });

    const contextValue = generateMessageInputContextValue({ attachments: [file] });

    const { getByTestId } = renderComponent(contextValue);

    const retryButton = getByTestId(`${type}-preview-item-retry-button`);

    fireEvent.click(retryButton);

    expect(contextValue[`upload${capitalize(type)}`]).toHaveBeenCalledWith(file.id);
  });

  it.each(['file', 'image'])('removes %s from the state when remove button is clicked', (type) => {
    const file =
      type === 'image'
        ? generateMessageComposerImageAttachment()
        : generateMessageComposerFileAttachment();

    const contextValue = generateMessageInputContextValue({ attachments: [file] });

    const { getByTestId } = renderComponent(contextValue);

    const deleteButton = getByTestId(`${type}-preview-item-delete-button`);

    fireEvent.click(deleteButton);

    expect(contextValue.removeAttachment).toHaveBeenCalledWith(file.id);
  });
});
