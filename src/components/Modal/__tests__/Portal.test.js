import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Portal } from '../Portal';

const childrenText = 'appended child';
const targetContainerTestId = 'target';
const sourceContainerTestId = 'source';

describe('Modal', () => {
  afterEach(cleanup); // eslint-disable-line
  it('should attach children to the existing container', async () => {
    const TestComponent = () => {
      const [container, setContainer] = useState(null);
      return (
        <div>
          <div data-testid={sourceContainerTestId}>
            {container && (
              <Portal container={container}>
                <div>{childrenText}</div>
              </Portal>
            )}
          </div>
          <div data-testid={targetContainerTestId} ref={setContainer} />
        </div>
      );
    };
    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId(targetContainerTestId)).toHaveTextContent(childrenText);
    });
  });
  it('should find an existing container by id and attach children to it', async () => {
    render(
      <div>
        <div data-testid={sourceContainerTestId}>
          <Portal containerId={targetContainerTestId}>
            <div>{childrenText}</div>
          </Portal>
        </div>
        <div data-testid={targetContainerTestId} id={targetContainerTestId} />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId(targetContainerTestId)).toHaveTextContent(childrenText);
    });
  });
  it('should create a container with a given id and append it to an existing element with id "root"', async () => {
    render(
      <div>
        <div data-testid={sourceContainerTestId}>
          <Portal containerId='non-existent'>
            <div>{childrenText}</div>
          </Portal>
        </div>
        <div id='root' />
        <div data-testid={targetContainerTestId} id={targetContainerTestId} />
      </div>,
    );

    await waitFor(() => {
      const [source, root, falseTarget] = document.body.children[0].children[0].children;
      expect(source).not.toHaveTextContent(childrenText);
      expect(falseTarget).not.toHaveTextContent(childrenText);
      expect(root).toHaveTextContent(childrenText);
      expect(root.firstChild).toHaveClass('str-chat');
      expect(root.firstChild).toHaveAttribute('id', 'non-existent');
    });
  });
  it('should create a div anchor with a given id and append it to the document.body', async () => {
    render(
      <div>
        <div data-testid={sourceContainerTestId}>
          <Portal containerId='non-existent'>
            <div>{childrenText}</div>
          </Portal>
        </div>
        <div />
        <div data-testid={targetContainerTestId} id={targetContainerTestId} />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId(targetContainerTestId)).not.toHaveTextContent(childrenText);
      expect(document.body.children).toHaveLength(2);
      expect(document.body.firstChild).not.toHaveTextContent(childrenText);
      expect(document.body.lastChild).toHaveTextContent(childrenText);
      expect(document.body.lastChild).toHaveClass('str-chat');
      expect(document.body.lastChild).toHaveAttribute('id', 'non-existent');
    });
  });
  it.each([
    ['not', false],
    ['', true],
  ])('should %s remove the appended container on portal unmount', async (_, removeContainer) => {
    const TestComponent = () => {
      const [renderPortal, setRenderPortal] = useState(true);
      return (
        <div>
          <div data-testid={sourceContainerTestId} onClick={() => setRenderPortal(false)}>
            {renderPortal && (
              <Portal containerId={targetContainerTestId} removeContainer={removeContainer}>
                <div>{childrenText}</div>
              </Portal>
            )}
          </div>
          <div data-testid={targetContainerTestId} id={targetContainerTestId} />
        </div>
      );
    };
    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId(targetContainerTestId)).toHaveTextContent(childrenText);
    });

    await act(() => {
      fireEvent.click(screen.getByTestId(sourceContainerTestId));
    });

    await waitFor(() => {
      if (removeContainer) {
        expect(screen.queryByTestId(targetContainerTestId)).not.toBeInTheDocument();
        expect(screen.queryByText(targetContainerTestId)).not.toBeInTheDocument();
      } else {
        expect(screen.queryByTestId(targetContainerTestId)).toBeInTheDocument();
        expect(screen.getByTestId(targetContainerTestId)).not.toHaveTextContent(childrenText);
      }
    });
  });
});
