/* eslint-disable jest-dom/prefer-in-document */

import React, { useEffect } from 'react';

import { act, fireEvent, render } from '@testing-library/react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';

import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { AttachmentPreviewList } from '../AttachmentPreviewList';
import { ComponentProvider, useChatContext } from '../../../context';
import { MessageInputContextProvider } from '../../../context/MessageInputContext';

import { generateUpload, initClientWithChannel } from '../../../mock-builders';

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
    <ComponentProvider value={{}}>
      <MessageInputContextProvider value={{ ...generateMessageInputContextValue(), ...value }}>
        <AttachmentPreviewList />
      </MessageInputContextProvider>
    </ComponentProvider>,
  );

jest.mock('nanoid', () => ({
  nanoid: () => 'randomNanoId',
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

  it('should render custom BaseImage component', async () => {
    const ActiveChannelSetter = ({ activeChannel }) => {
      const { setActiveChannel } = useChatContext();
      useEffect(() => {
        setActiveChannel(activeChannel);
      }, [activeChannel]); // eslint-disable-line
      return null;
    };

    const { channel, client } = await initClientWithChannel();

    const names = ['image-upload-1', 'image-upload-2'];
    const images = names.map((name, id) =>
      generateUpload({
        fileOverrides: { name, type: 'image' },
        objectOverrides: { id },
      }),
    );
    const CustomBaseImage = (props) => <img {...props} data-testid={'custom-base-image'} />;
    let result;
    await act(() => {
      result = render(
        <Chat client={client}>
          <ActiveChannelSetter activeChannel={channel} />
          <Channel BaseImage={CustomBaseImage}>
            <MessageInputContextProvider value={generateMessageInputContextValue({ images })}>
              <AttachmentPreviewList />
            </MessageInputContextProvider>
          </Channel>
          ,
        </Chat>,
      );
    });
    expect(result.container).toMatchSnapshot();
  });
});
