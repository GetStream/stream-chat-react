import React from 'react';
import renderer from 'react-test-renderer';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { MML } from '../MML';
import { ChatContext } from '../../../context';

afterEach(cleanup); // eslint-disable-line

describe('MML', () => {
  it('should render null without any source', () => {
    const tree = renderer.create(<MML source='' />).toJSON();
    expect(tree).toMatchInlineSnapshot(`null`);
  });

  it('should render a basic mml', () => {
    const tree = renderer.create(<MML source='<mml>Some Text</mml>' />).toJSON();

    expect(tree).toMatchInlineSnapshot(`
      <div
        className="mml-container  mml-align-right"
        data-testid="mml-container"
      >
        <form
          className="mml-wrap"
          data-testid="mml-form"
          onSubmit={[Function]}
        >
          <div
            className="mml-text"
          >
            Some Text
          </div>
          
          
        </form>
      </div>
    `);
  });

  it('should render with different align prop', () => {
    const { getByTestId, rerender } = render(<MML align='left' source='<mml></mml>' />);
    expect(getByTestId('mml-container')).toHaveClass('mml-align-left');

    rerender(<MML align='right' source='<mml></mml>' />);
    expect(getByTestId('mml-container')).toHaveClass('mml-align-right');
  });

  it('should pass down themes from chat context', () => {
    const { getByTestId } = render(
      <ChatContext.Provider value={{ theme: 'team dark' }}>
        <MML source='<mml></mml>' />,
      </ChatContext.Provider>,
    );
    expect(getByTestId('mml-container')).toHaveClass('team-dark');
  });

  it('actionHandler should be called', async () => {
    const handler = jest.fn();
    const { getByTestId } = render(<MML actionHandler={handler} source='<mml></mml>' />);

    expect(handler).toHaveBeenCalledTimes(0);
    act(() => {
      fireEvent.submit(getByTestId('mml-form'));
    });

    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({});
    });
  });

  it('actionHandler should be called with data', async () => {
    const handler = jest.fn();
    const { getByTestId } = render(
      <MML
        actionHandler={handler}
        source="<mml name='mml_number'><number name='no' value='100'/></mml>"
      />,
    );

    expect(handler).toHaveBeenCalledTimes(0);
    act(() => {
      fireEvent.submit(getByTestId('mml-form'));
    });

    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        mml_name: 'mml_number',
        no: '100',
      });
    });
  });
});
