import type { PropsWithChildren } from 'react';
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

export type DragAndDropContainerProps = PropsWithChildren<{
  className?: string;
  draggable?: boolean;
  onSetNewOrder?: (newOrder: number[]) => void;
}>;

export const DragAndDropContainer = ({
  children,
  className,
  draggable,
  onSetNewOrder,
}: DragAndDropContainerProps) => {
  const [order, setOrder] = useState<number[]>([]);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const moveDirection =
    dragStartIndex === null || dragOverIndex === null
      ? undefined
      : dragStartIndex <= dragOverIndex
        ? 'down'
        : 'up';

  const childrenArray = React.Children.toArray(children);

  useEffect(() => {
    setOrder(React.Children.map(children, (_, index) => index) || []);
  }, [children]);

  useEffect(() => {
    if (!container) return;

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      const draggableItem = target.closest('.str-chat__drag-and-drop-container__item');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }

      if (draggableItem instanceof HTMLElement) {
        const index = Array.from(draggableItem.parentElement?.children || []).indexOf(
          draggableItem,
        );
        setDragStartIndex(index);
        e.dataTransfer?.setData('text/plain', index.toString());
        draggableItem.style.opacity = '0.3';
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const draggableItem = target.closest('.str-chat__drag-and-drop-container__item');
      if (draggableItem instanceof HTMLElement) {
        const index = Array.from(draggableItem.parentElement?.children || []).indexOf(
          draggableItem,
        );
        setDragOverIndex(index);
      }
    };

    const handleDragLeave = () => {
      setDragOverIndex(null);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const draggedIndex = parseInt(e.dataTransfer?.getData('text/plain') || '-1', 10);
      const target = e.target as HTMLElement;
      const draggableItem = target.closest('.str-chat__drag-and-drop-container__item');
      if (draggableItem instanceof HTMLElement) {
        const dropIndex = Array.from(draggableItem.parentElement?.children || []).indexOf(
          draggableItem,
        );
        if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
          setOrder((prevOrder) => {
            const newOrder = [...prevOrder];
            const [removed] = newOrder.splice(draggedIndex, 1);
            newOrder.splice(dropIndex, 0, removed);
            onSetNewOrder?.(newOrder);
            return newOrder;
          });
        }
      }
      setDragStartIndex(null);
      setDragOverIndex(null);
    };

    const handleDragEnd = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLElement) {
        target.style.opacity = '';
      }
      setDragStartIndex(null);
      setDragOverIndex(null);
    };

    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragend', handleDragEnd);

    return () => {
      container.removeEventListener('dragstart', handleDragStart);
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('dragleave', handleDragLeave);
      container.removeEventListener('drop', handleDrop);
      container.removeEventListener('dragend', handleDragEnd);
    };
  }, [container, onSetNewOrder]);

  return (
    <div
      className={clsx('str-chat__drag-and-drop-container', className)}
      ref={setContainer}
    >
      {order.map((originalIndex, currentIndex) => {
        const child = childrenArray[originalIndex];
        return (
          <div
            className={clsx('str-chat__drag-and-drop-container__item', {
              'str-chat__drag-and-drop-container__item--dragged-over-from-bottom':
                moveDirection === 'up' && dragOverIndex === currentIndex,
              'str-chat__drag-and-drop-container__item--dragged-over-from-top':
                moveDirection === 'down' && dragOverIndex === currentIndex,
            })}
            draggable={draggable}
            key={
              React.isValidElement(child) ? child.key : `draggable-item-${originalIndex}`
            }
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
