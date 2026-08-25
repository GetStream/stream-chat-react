import { Button } from 'stream-chat-react';
import { type Plain, type ReferenceRow, valueAtPath } from './configurationTree';

type ReferenceValueEditorProps = {
  onClear: () => void;
  onSet: (value: unknown) => void;
  row: ReferenceRow;
  tree: Plain;
};

/**
 * Sets a single path from the reference listing, so the common case — flip one flag, change one number —
 * does not mean finding that key by eye in a 400-line JSON document.
 *
 * It writes into the same draft the JSON editor holds, rather than into `client.config` directly. That
 * keeps one source of truth: `Apply` still diffs the whole draft, and `Format` / `Re-read` / `Reset all`
 * keep working without knowing this control exists.
 *
 * Only types JSON can carry get a control. Objects and arrays fall back to the `Add` button, which seeds
 * the path in the JSON editor — a nested shape is not something a single inline widget can edit honestly.
 */
export const ReferenceValueEditor = ({
  onClear,
  onSet,
  row,
  tree,
}: ReferenceValueEditorProps) => {
  const value = valueAtPath(tree, row.path);
  const isSet = value !== undefined;

  const control = () => {
    switch (row.type) {
      case 'boolean':
        return (
          <input
            aria-label={row.path}
            checked={value === true}
            className='app__configuration-tab__reference-input'
            onChange={(event) => onSet(event.target.checked)}
            type='checkbox'
          />
        );
      case 'enum':
        return (
          <select
            aria-label={row.path}
            className='app__configuration-tab__reference-input'
            onChange={(event) => onSet(event.target.value)}
            value={typeof value === 'string' ? value : ''}
          >
            <option disabled value=''>
              —
            </option>
            {row.enumValues?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'number':
        return (
          <input
            aria-label={row.path}
            className='app__configuration-tab__reference-input'
            // Empty clears the path rather than writing NaN, which is not valid JSON and would make the
            // whole draft unparseable from one stray keystroke.
            onChange={(event) =>
              event.target.value === '' ? onClear() : onSet(Number(event.target.value))
            }
            type='number'
            value={typeof value === 'number' ? value : ''}
          />
        );
      case 'string':
        return (
          <input
            aria-label={row.path}
            className='app__configuration-tab__reference-input'
            onChange={(event) => onSet(event.target.value)}
            type='text'
            value={typeof value === 'string' ? value : ''}
          />
        );
      default:
        // 'object', 'number[]', 'string[]' — seed it in the JSON editor instead.
        return isSet ? null : (
          <Button
            appearance='outline'
            onClick={() => onSet(row.insertValue)}
            size='sm'
            title='Add this path to the JSON editor'
            variant='secondary'
          >
            Add
          </Button>
        );
    }
  };

  return (
    <span className='app__configuration-tab__reference-control'>
      {control()}
      {isSet && (
        <Button
          appearance='ghost'
          onClick={onClear}
          size='sm'
          title='Remove this path from the editor — it falls back to whatever it resolves to'
          variant='secondary'
        >
          Clear
        </Button>
      )}
    </span>
  );
};
