import clsx from 'clsx';
import { type ReactNode, useState } from 'react';
import {
  Button,
  IconArrowDown,
  IconArrowUp,
  IconReorder,
  SwitchField,
} from 'stream-chat-react';

export type SortableSection = {
  description?: ReactNode;
  label: string;
  type: string;
};

type SortableSectionListProps = {
  /** Names the list for assistive tech. */
  ariaLabel: string;
  /** Prefixes the switches' element IDs, which must be unique on the page. */
  idPrefix: string;
  onOrderChange: (order: string[]) => void;
  /** Sections in their current order. */
  sections: SortableSection[];
  /** Types switched off. Without `onEnabledChange` the rows have no switch. */
  disabledTypes?: string[];
  onEnabledChange?: (type: string, enabled: boolean) => void;
};

const moveItem = (order: string[], from: number, to: number) => {
  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

const moveButtonClassName =
  'str-chat__button--ghost str-chat__button--secondary str-chat__button--size-sm str-chat__button--circular';

/**
 * A list to drag into order, with up and down buttons doing the same from the keyboard, and an
 * optional switch per row.
 */
export const SortableSectionList = ({
  ariaLabel,
  disabledTypes = [],
  idPrefix,
  onEnabledChange,
  onOrderChange,
  sections,
}: SortableSectionListProps) => {
  const order = sections.map(({ type }) => type);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const endDrag = () => {
    setDraggedType(null);
    setDropIndex(null);
  };

  return (
    <ol
      aria-label={ariaLabel}
      className='app__sortable-sections'
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDropIndex(null);
        }
      }}
    >
      {sections.map(({ description, label, type }, index) => {
        const enabled = !disabledTypes.includes(type);

        return (
          <li
            className={clsx('app__sortable-sections__item', {
              'app__sortable-sections__item--disabled': !enabled,
              'app__sortable-sections__item--dragged': draggedType === type,
              'app__sortable-sections__item--drop-target':
                dropIndex === index && draggedType !== type,
            })}
            draggable
            key={type}
            onDragEnd={endDrag}
            onDragOver={(event) => {
              if (!draggedType) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDropIndex(index);
            }}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              // Firefox starts a drag only once data is set.
              event.dataTransfer.setData('text/plain', type);
              setDraggedType(type);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (draggedType) {
                onOrderChange(moveItem(order, order.indexOf(draggedType), index));
              }
              endDrag();
            }}
          >
            <span aria-hidden className='app__sortable-sections__handle'>
              <IconReorder />
            </span>
            <div className='app__sortable-sections__text'>
              <div className='app__sortable-sections__label'>{label}</div>
              {description && (
                <div className='app__sortable-sections__comment'>{description}</div>
              )}
            </div>
            <div className='app__sortable-sections__controls'>
              <Button
                aria-label={`Move ${label} up`}
                className={moveButtonClassName}
                disabled={index === 0}
                onClick={() => onOrderChange(moveItem(order, index, index - 1))}
              >
                <IconArrowUp />
              </Button>
              <Button
                aria-label={`Move ${label} down`}
                className={moveButtonClassName}
                disabled={index === order.length - 1}
                onClick={() => onOrderChange(moveItem(order, index, index + 1))}
              >
                <IconArrowDown />
              </Button>
              {onEnabledChange && (
                <SwitchField
                  aria-label={`Show ${label}`}
                  checked={enabled}
                  id={`${idPrefix}-${type}-switch`}
                  onChange={(event) => onEnabledChange(type, event.target.checked)}
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
