import React from 'react';

type StubComponents = {
  EmptyPlaceholder?: React.ComponentType;
  Footer?: React.ComponentType;
};

/**
 * Renders react-virtuoso's lists synchronously: jsdom has no layout, so the real components would
 * window down to zero items. Like the real ones, the stubs render the empty slot while there are no
 * items and the footer always.
 */
export const Virtuoso = ({
  components = {},
  data = [],
  itemContent,
}: {
  components?: StubComponents;
  data?: unknown[];
  itemContent: (index: number, item: unknown) => React.ReactNode;
}) => {
  const { EmptyPlaceholder, Footer } = components;
  return (
    <div data-testid='virtuoso'>
      {data.length === 0
        ? EmptyPlaceholder && <EmptyPlaceholder />
        : data.map((item, index) => (
            <React.Fragment key={index}>{itemContent(index, item)}</React.Fragment>
          ))}
      {Footer && <Footer />}
    </div>
  );
};

export const GroupedVirtuoso = ({
  components = {},
  groupContent,
  groupCounts = [],
  itemContent,
}: {
  components?: StubComponents;
  groupContent: (groupIndex: number) => React.ReactNode;
  groupCounts?: number[];
  itemContent: (index: number, groupIndex: number) => React.ReactNode;
}) => {
  const { EmptyPlaceholder, Footer } = components;
  const totalItems = groupCounts.reduce((sum, count) => sum + count, 0);
  let itemIndex = 0;
  return (
    <div data-testid='grouped-virtuoso'>
      {totalItems === 0
        ? EmptyPlaceholder && <EmptyPlaceholder />
        : groupCounts.map((count, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {groupContent(groupIndex)}
              {Array.from({ length: count }, () => {
                const index = itemIndex++;
                return (
                  <React.Fragment key={index}>
                    {itemContent(index, groupIndex)}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
      {Footer && <Footer />}
    </div>
  );
};
