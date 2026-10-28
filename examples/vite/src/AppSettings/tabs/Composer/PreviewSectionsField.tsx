import clsx from 'clsx';
import { useState } from 'react';
import {
  Button,
  type DefaultMessageComposerPreviewType,
  IconArrowDown,
  IconArrowUp,
  IconReorder,
  SwitchField,
} from 'stream-chat-react';

import {
  PREVIEW_SECTION_INFO,
  resolvePreviewSectionOrder,
} from '../../../ComposerPreviews/previewSections';
import { appSettingsStore, useAppSettingsState } from '../../state';

const moveItem = (order: string[], from: number, to: number) => {
  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

/**
 * The composer's preview sections as a list to drag into order and switch on or off. Up and down
 * buttons do the same from the keyboard.
 */
export const PreviewSectionsField = () => {
  const { composer } = useAppSettingsState();
  const order = resolvePreviewSectionOrder(composer.previewSectionOrder);
  const { disabledPreviewSections } = composer;
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const setOrder = (previewSectionOrder: string[]) =>
    appSettingsStore.partialNext({ composer: { ...composer, previewSectionOrder } });

  const setEnabled = (type: string, enabled: boolean) =>
    appSettingsStore.partialNext({
      composer: {
        ...composer,
        disabledPreviewSections: enabled
          ? disabledPreviewSections.filter((disabled) => disabled !== type)
          : [...disabledPreviewSections, type],
      },
    });

  const endDrag = () => {
    setDraggedType(null);
    setDropIndex(null);
  };

  return (
    <ol
      aria-label='Composer preview sections'
      className='app__composer-preview-sections'
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDropIndex(null);
        }
      }}
    >
      {order.map((type, index) => {
        const { label, removes } =
          PREVIEW_SECTION_INFO[type as DefaultMessageComposerPreviewType];
        const enabled = !disabledPreviewSections.includes(type);

        return (
          <li
            className={clsx('app__composer-preview-sections__item', {
              'app__composer-preview-sections__item--disabled': !enabled,
              'app__composer-preview-sections__item--dragged': draggedType === type,
              'app__composer-preview-sections__item--drop-target':
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
              if (draggedType)
                setOrder(moveItem(order, order.indexOf(draggedType), index));
              endDrag();
            }}
          >
            <span aria-hidden className='app__composer-preview-sections__handle'>
              <IconReorder />
            </span>
            <div className='app__composer-preview-sections__text'>
              <div className='app__composer-preview-sections__label'>{label}</div>
              <div className='app__composer-preview-sections__comment'>
                <code>{type}</code>. Removing it also removes: {removes}
              </div>
            </div>
            <div className='app__composer-preview-sections__controls'>
              <Button
                aria-label={`Move ${label} up`}
                className='str-chat__button--ghost str-chat__button--secondary str-chat__button--size-sm str-chat__button--circular'
                disabled={index === 0}
                onClick={() => setOrder(moveItem(order, index, index - 1))}
              >
                <IconArrowUp />
              </Button>
              <Button
                aria-label={`Move ${label} down`}
                className='str-chat__button--ghost str-chat__button--secondary str-chat__button--size-sm str-chat__button--circular'
                disabled={index === order.length - 1}
                onClick={() => setOrder(moveItem(order, index, index + 1))}
              >
                <IconArrowDown />
              </Button>
              <SwitchField
                aria-label={`Show ${label}`}
                checked={enabled}
                id={`composer-preview-section-${type}-switch`}
                onChange={(event) => setEnabled(type, event.target.checked)}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
};
