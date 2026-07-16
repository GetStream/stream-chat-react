import { useRef, useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useGridKeyboardNav } from '../useGridKeyboardNav';

// jsdom doesn't implement scrollIntoView; the hook calls it after focusing a cell.
beforeAll(() => {
  Element.prototype.scrollIntoView = () => undefined;
});

type Category = { emojis: { id: string }[]; id: string };

/**
 * Mimics the virtualized grid: only `initialMounted` categories are in the DOM, and
 * asking to scroll to a category "mounts" it (as Virtuoso would). This lets us prove
 * navigation can cross into a category that virtualization has not yet rendered.
 */
const Harness = ({
  categories,
  initialMounted,
}: {
  categories: Category[];
  initialMounted: string[];
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState<string[]>(initialMounted);
  const scrollToCategory = (id: string) =>
    setMounted((current) => (current.includes(id) ? current : [...current, id]));
  const { onKeyDown } = useGridKeyboardNav(ref, { categories, scrollToCategory });

  return (
    <div data-testid='grid' onKeyDown={onKeyDown} ref={ref}>
      {categories
        .filter((category) => mounted.includes(category.id))
        .map((category) => (
          <section data-category-id={category.id} key={category.id}>
            {category.emojis.map(({ id }) => (
              <button
                className='str-chat__emoji-picker__emoji'
                data-emoji-id={id}
                key={id}
                tabIndex={-1}
                type='button'
              >
                {id}
              </button>
            ))}
          </section>
        ))}
    </div>
  );
};

const categories: Category[] = [
  { emojis: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }], id: 'a' },
  { emojis: [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }], id: 'b' },
];

describe('useGridKeyboardNav across virtualization boundaries', () => {
  it('ArrowRight past the last mounted cell mounts the next category and focuses its first cell', async () => {
    render(<Harness categories={categories} initialMounted={['a']} />);
    // The next category isn't mounted yet (virtualization).
    expect(screen.queryByText('b1')).not.toBeInTheDocument();

    screen.getByText('a3').focus();
    fireEvent.keyDown(screen.getByText('a3'), { key: 'ArrowRight' });

    await waitFor(() => expect(screen.getByText('b1')).toHaveFocus());
  });

  it('ArrowLeft before the first mounted cell mounts the previous category and focuses its last cell', async () => {
    render(<Harness categories={categories} initialMounted={['b']} />);
    expect(screen.queryByText('a3')).not.toBeInTheDocument();

    screen.getByText('b1').focus();
    fireEvent.keyDown(screen.getByText('b1'), { key: 'ArrowLeft' });

    await waitFor(() => expect(screen.getByText('a3')).toHaveFocus());
  });

  it('ArrowRight still moves within the mounted set without scrolling', () => {
    render(<Harness categories={categories} initialMounted={['a']} />);

    screen.getByText('a1').focus();
    fireEvent.keyDown(screen.getByText('a1'), { key: 'ArrowRight' });

    expect(screen.getByText('a2')).toHaveFocus();
  });

  it('does not try to cross categories in the search view (flat results, no category sections)', () => {
    const scrollToCategory = vi.fn();
    const SearchHarness = () => {
      const ref = useRef<HTMLDivElement>(null);
      const { onKeyDown } = useGridKeyboardNav(ref, { categories, scrollToCategory });
      // Search results render as a flat grid with no [data-category-id] ancestor.
      return (
        <div data-testid='grid' onKeyDown={onKeyDown} ref={ref}>
          {['r1', 'r2'].map((id) => (
            <button
              className='str-chat__emoji-picker__emoji'
              data-emoji-id={id}
              key={id}
              tabIndex={-1}
              type='button'
            >
              {id}
            </button>
          ))}
        </div>
      );
    };
    render(<SearchHarness />);

    // ArrowRight at the last result clamps (no category to scroll to)…
    screen.getByText('r2').focus();
    fireEvent.keyDown(screen.getByText('r2'), { key: 'ArrowRight' });
    expect(screen.getByText('r2')).toHaveFocus();

    // …and Home goes to the first result rather than scrolling to a category.
    fireEvent.keyDown(screen.getByText('r2'), { key: 'Home' });
    expect(screen.getByText('r1')).toHaveFocus();

    expect(scrollToCategory).not.toHaveBeenCalled();
  });
});
