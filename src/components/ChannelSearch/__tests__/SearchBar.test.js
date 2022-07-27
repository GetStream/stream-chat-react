import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';

import { SearchBar } from '../SearchBar';
import { Chat } from '../../Chat';
import { useChannelSearch } from '../hooks/useChannelSearch';

import {
  generateUser,
  getTestClientWithUser,
  queryUsersApi,
  useMockedApis,
} from '../../../mock-builders';

// SearchBar needs searchBarRef to work correctly. That is not expected to be used with theme version 1.
jest.spyOn(window, 'getComputedStyle').mockReturnValue({
  getPropertyValue: jest.fn().mockReturnValue('2'),
});

let client;
const inputText = new Date().getTime().toString();

const AppMenu = () => <div>AppMenu</div>;
const ClearInputIcon = () => <div>CustomClearInputIcon</div>;
const MenuIcon = () => <div>CustomMenuIcon</div>;
const SearchInputIcon = () => <div>CustomSearchInputIcon</div>;

const SearchContainer = ({ props = {}, searchParams }) => {
  const controller = useChannelSearch(searchParams);
  return <SearchBar {...controller} {...props} />;
};

const renderComponent = ({ client, props = {}, searchParams }) =>
  render(
    <Chat client={client}>
      <SearchContainer props={props} searchParams={searchParams} />
    </Chat>,
  );

describe('SearchBar', () => {
  beforeEach(async () => {
    const user = generateUser();
    client = await getTestClientWithUser({ id: user.id });
    useMockedApis(client, [queryUsersApi([user])]); // eslint-disable-line react-hooks/rules-of-hooks
  });

  it.each([
    ['enable', true, 'xxxxxxxxxx', 'xxxxxxxxxx'],
    ['disable', false, 'xxxxxxxxxx', ''],
  ])('should %s typing', async (_, enabled, inputText, expectedValue) => {
    await renderComponent({ client, searchParams: { enabled } });

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
            activateSearch={jest.fn}
            clearState={jest.fn}
            exitSearch={jest.fn}
            inputIsFocused={false}
            inputRef={{ current: null }}
            onSearch={jest.fn}
            query=''
            searchBarRef={{ current: null }}
          />,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
  it.each([
    ['should not render', undefined],
    ['should render', AppMenu],
  ])('%s menu icon', async (_, AppMenu) => {
    await render(
      <SearchBar
        activateSearch={jest.fn}
        AppMenu={AppMenu}
        clearState={jest.fn}
        exitSearch={jest.fn}
        inputIsFocused={false}
        inputRef={{ current: null }}
        onSearch={jest.fn}
        query=''
        searchBarRef={{ current: null }}
      />,
    );
    await waitFor(() => {
      if (!AppMenu) {
        expect(screen.queryByTestId('menu-icon')).not.toBeInTheDocument();
      } else {
        expect(screen.queryByTestId('menu-icon')).toBeInTheDocument();
      }
    });
  });
  it('should render custom icons', async () => {
    await render(
      <SearchBar
        activateSearch={jest.fn}
        AppMenu={AppMenu}
        ClearInputIcon={ClearInputIcon}
        clearState={jest.fn}
        exitSearch={jest.fn}
        inputIsFocused={false}
        inputRef={{ current: null }}
        MenuIcon={MenuIcon}
        onSearch={jest.fn}
        query=''
        searchBarRef={{ current: null }}
        SearchInputIcon={SearchInputIcon}
      />,
    );
    expect(screen.queryByText('CustomClearInputIcon')).toBeInTheDocument();
    expect(screen.queryByText('CustomMenuIcon')).toBeInTheDocument();
    expect(screen.queryByText('CustomSearchInputIcon')).toBeInTheDocument();
  });

  it('should not render ExitSearchIcon if input is not focused', async () => {
    await act(() => {
      renderComponent({ client, searchParams: { enabled: true } });
    });

    await waitFor(() => {
      expect(screen.queryByTestId('return-icon')).not.toBeInTheDocument();
    });
  });

  it('should render ExitSearchIcon on input focus', async () => {
    await renderComponent({ client, searchParams: { enabled: true } });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      fireEvent.focus(input);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('return-icon')).toBeInTheDocument();
    });
  });
  it('should render custom ExitSearchIcon', async () => {
    const ExitSearchIcon = () => <div>CustomExitSearchIcon</div>;
    await renderComponent({
      client,
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
  it('should render custom input placeholder', async () => {
    const placeholder = 'Type and search xxxx';
    await act(() => {
      renderComponent({
        client,
        props: { placeholder },
        searchParams: { enabled: true },
      });
    });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(placeholder)).toBeInTheDocument();
    });
  });
  it('should clear input', async () => {
    renderComponent({ client, searchParams: { enabled: true } });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      input.focus();
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

    await act(() => {
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(input).toHaveValue('');
      expect(input).toHaveFocus();
      expect(screen.queryByTestId('return-icon')).toBeInTheDocument();
    });
  });

  it('should exit search UI', async () => {
    await renderComponent({ client, searchParams: { enabled: true } });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      input.focus();
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

    await act(() => {
      fireEvent.click(returnButton);
    });
    await waitFor(() => {
      expect(input).toHaveValue('');
      expect(input).not.toHaveFocus();
      expect(screen.queryByTestId('return-icon')).not.toBeInTheDocument();
    });
  });

  it('should render custom SearchInput', async () => {
    const SearchInput = () => <div>CustomSearchInput</div>;
    await act(() => {
      renderComponent({
        client,
        props: { SearchInput },
        searchParams: { enabled: true },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('CustomSearchInput')).toBeInTheDocument();
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });
  });
});
