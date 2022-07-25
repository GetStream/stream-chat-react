import React from 'react';
import { act, fireEvent, queryByTestId, render, screen, waitFor } from '@testing-library/react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';

import { SearchBar } from '../SearchBar';
import { Chat } from '../../Chat';
import { useChannelSearch } from '../hooks/useChannelSearch';

import {
  generateChannel,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

async function createClientWithChannel() {
  const mockedChannel = generateChannel();
  const client = await getTestClientWithUser({ id: 'id' });
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
  const channel = client.channel('messaging', mockedChannel.id);
  await channel.watch();

  return { channel, client };
}

const SearchContainer = ({ props = {}, searchParams }) => {
  const controller = useChannelSearch(searchParams);
  return <SearchBar {...controller} {...props} />;
};

const renderComponent = async ({ props = {}, searchParams }) => {
  const { client } = await createClientWithChannel();

  return render(
    <Chat client={client}>
      <SearchContainer props={props} searchParams={searchParams} />
    </Chat>,
  );
};

describe('SearchBar', () => {
  it.each([
    ['enable', true, 'xxxxxxxxxx', 'xxxxxxxxxx'],
    ['disable', false, 'xxxxxxxxxx', ''],
  ])('should %s typing', async (_, enabled, inputText, expectedValue) => {
    await renderComponent({ searchParams: { enabled } });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      fireEvent.change(input, {
        target: {
          value: inputText,
        },
      });
    });

    await waitFor(() => {
      expect(input).toHaveValue(expectedValue);
    });
  });
  it('should render default layout', () => {
    expect(
      renderer
        .create(
          <SearchBar
            clearState={jest.fn}
            inputRef={{ current: null }}
            onSearch={jest.fn}
            query=''
          />,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
  it('should render custom icons', async () => {
    const ClearInputIcon = () => <div>CustomClearInputIcon</div>;
    const MenuIcon = () => <div>CustomMenuIcon</div>;
    const SearchInputIcon = () => <div>CustomSearchInputIcon</div>;
    await render(
      <SearchBar
        ClearInputIcon={ClearInputIcon}
        clearState={jest.fn}
        inputRef={{ current: null }}
        MenuIcon={MenuIcon}
        onSearch={jest.fn}
        query=''
        SearchInputIcon={SearchInputIcon}
      />,
    );
    expect(screen.queryByText('CustomClearInputIcon')).toBeInTheDocument();
    expect(screen.queryByText('CustomMenuIcon')).toBeInTheDocument();
    expect(screen.queryByText('CustomSearchInputIcon')).toBeInTheDocument();
  });

  it.todo('should not render ExitSearchIcon if input not focused', async () => {
    await renderComponent({ searchParams: { enabled: true } });

    await waitFor(() => {
      expect(screen.queryByTestId('return-icon')).not.toBeInTheDocument();
    });
  });

  it('should render ExitSearchIcon on input focus', async () => {
    await renderComponent({ searchParams: { enabled: true } });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      fireEvent.focus(input);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('return-icon')).toBeInTheDocument();
    });
  });
  it.todo('should render custom ExitSearchIcon', async () => {
    const ExitSearchIcon = () => <div>CustomExitSearchIcon</div>;
    await renderComponent({
      props: { ExitSearchIcon },
      searchParams: { enabled: true },
    });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      fireEvent.focus(input);
    });

    await waitFor(() => {
      expect(screen.queryByText('CustomExitSearchIcon')).toBeInTheDocument();
    });
  });
  it.todo('should render custom input placeholder', async () => {
    const placeholder = 'Type and search xxxx';
    await renderComponent({
      props: { placeholder },
      searchParams: { enabled: true },
    });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(placeholder)).toBeInTheDocument();
    });
  });
  it.todo('should clear input', async () => {
    const inputText = +new Date().getTime();
    await renderComponent({ searchParams: { enabled: true } });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      fireEvent.change(input, {
        target: {
          value: inputText,
        },
      });
    });

    await waitFor(() => {
      expect(input).toHaveValue(inputText);
    });

    const clearButton = screen.queryByTestId('clear-input-button');

    await (() => {
      fireEvent.click(clearButton);
    });
    await waitFor(() => {
      expect(input).toBeEmpty();
      expect(input).toHaveFocus();
      expect(queryByTestId('return-icon')).toBeInTheDocument();
    });
  });

  it.todo('should exit search UI', async () => {
    const inputText = +new Date().getTime();
    await renderComponent({ searchParams: { enabled: true } });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      fireEvent.change(input, {
        target: {
          value: inputText,
        },
      });
    });

    await waitFor(() => {
      expect(input).toHaveValue(inputText);
    });

    const returnButton = screen.queryByTestId('search-bar-button');

    await (() => {
      fireEvent.click(returnButton);
    });
    await waitFor(() => {
      expect(input).toBeEmpty();
      expect(input).not.toHaveFocus();
      expect(queryByTestId('return-icon')).not.toBeInTheDocument();
      expect(queryByTestId('menu')).toBeInTheDocument();
    });
  });

  it('should render custom SearchInput', async () => {
    const SearchInput = () => <div>CustomSearchInput</div>;
    await renderComponent({
      props: { SearchInput },
      searchParams: { enabled: true },
    });

    await waitFor(() => {
      expect(screen.queryByText('CustomSearchInput')).toBeInTheDocument();
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });
  });
});
