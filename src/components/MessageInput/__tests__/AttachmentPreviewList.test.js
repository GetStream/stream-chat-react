/* eslint-disable jest-dom/prefer-in-document */

import React, { useEffect } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';

import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { AttachmentPreviewList, ImagePreviewItem } from '../AttachmentPreviewList';
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

describe('ImagePreviewItem', () => {
  const BASE_IMAGE_TEST_ID = 'str-chat__base-image';
  const getImage = () => screen.queryByTestId(BASE_IMAGE_TEST_ID);
  const defaultId = '7VZCBda5mQQk49icgNaUJ';
  const imageUploads = {
    [defaultId]: {
      file: {
        path:
          '29c4727a-82ad-4a14-8a49-6a6ba94396b2.300a558c-cb2a-495d-ac5e-b703a24d313f.c7dff19.heic',
      },
      id: defaultId,
      state: 'finished',
      url: 'https://us-east.stream-io-cdn.com/1145265/images/abc&oh=6120&ow=8160',
    },
  };
  const defaultInputContext = {
    imageUploads,
    removeImage: jest.fn(),
    uploadImage: jest.fn(),
  };
  const renderImagePreviewItem = ({ id, ...inputContext } = {}) =>
    render(
      <ComponentProvider value={{}}>
        <MessageInputContextProvider value={{ ...defaultInputContext, ...inputContext }}>
          <ImagePreviewItem id={id || defaultId} />
        </MessageInputContextProvider>
      </ComponentProvider>,
    );

  it('does not render images not found in the input attachment state', () => {
    const { container } = renderImagePreviewItem({ id: 'X' });
    expect(container).toBeEmptyDOMElement();
  });
  it('does not render scraped images', () => {
    const { container } = renderImagePreviewItem({
      imageUploads: { [defaultId]: { ...imageUploads[defaultId], og_scrape_url: 'og_scrape_url' } },
    });
    expect(container).toBeEmpty();
  });
  it('renders uploading state', () => {
    const { container } = renderImagePreviewItem({
      imageUploads: { [defaultId]: { ...imageUploads[defaultId], state: 'uploading' } },
    });
    expect(container).toMatchSnapshot();
  });
  it('renders upload finished state', () => {
    const { container } = renderImagePreviewItem();
    expect(container).toMatchSnapshot();
  });
  it('renders upload failed state', () => {
    const { container } = renderImagePreviewItem({
      imageUploads: { [defaultId]: { ...imageUploads[defaultId], state: 'failed' } },
    });
    expect(container).toMatchSnapshot();
  });
  it('reflects the image load error with str-chat__attachment-preview-image--error class', () => {
    const { container } = renderImagePreviewItem();
    fireEvent.error(getImage());
    expect(container.children[0].className).toMatch('str-chat__attachment-preview-image--error');
  });
  it('asks to retry uploading the image', () => {
    renderImagePreviewItem({
      imageUploads: { [defaultId]: { ...imageUploads[defaultId], state: 'failed' } },
    });
    fireEvent.click(screen.getByTestId('image-preview-item-retry-button'));
    expect(defaultInputContext.uploadImage).toHaveBeenCalledTimes(1);
  });
  it('asks to remove image from input attachment state', () => {
    renderImagePreviewItem();
    fireEvent.click(screen.getByTestId('image-preview-item-delete-button'));
    expect(defaultInputContext.removeImage).toHaveBeenCalledTimes(1);
  });
});
