import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { GroupedVirtuoso } from 'react-virtuoso';

import { useModalContext, useTranslationContext } from '../../../../context';
import { getDateString } from '../../../../i18n/utils';
import { FileSizeIndicator } from '../../../../components/Attachment/components/FileSizeIndicator';
import { Prompt } from '../../../../components/Dialog';
import { FileIcon } from '../../../../components/FileIcon';
import { ListItemLayout } from '../../../../components/ListItemLayout';
import {
  SectionNavigatorHeader,
  type SectionNavigatorSectionContentProps,
} from '../../SectionNavigator';
import { ChannelDetailListLoadingIndicator } from '../../ChannelDetailListLoadingIndicator';
import { ChannelFilesEmptyList } from './ChannelFilesEmptyList';
import type { ChannelFileItem } from './ChannelFilesView.utils';
import { useChannelFilesSearch } from './useChannelFilesSearch';

// Wraps each virtualized file row so the horizontal inset can be applied to a
// stable class without padding the full-bleed sticky month headers.
const ChannelFilesItem = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function ChannelFilesItem({ className, ...props }, ref) {
    return (
      <div
        {...props}
        className={clsx('str-chat__channel-detail__files-view__item', className)}
        ref={ref}
      />
    );
  },
);

// Wraps each sticky month header. react-virtuoso applies `position: sticky` but
// leaves `top: auto`, so the headers never pin to the scroller top and
// consecutive months overlap; the class supplies the required `top: 0`.
const ChannelFilesGroup = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function ChannelFilesGroup({ className, ...props }, ref) {
    return (
      <div
        {...props}
        className={clsx('str-chat__channel-detail__files-view__group', className)}
        ref={ref}
      />
    );
  },
);

const ChannelFilesSectionHeader = ({ timestamp }: { timestamp?: string }) => {
  const { t, tDateTimeParser } = useTranslationContext('ChannelFilesView');
  const label = getDateString({
    format: 'MMMM YYYY',
    messageCreatedAt: timestamp,
    t,
    tDateTimeParser,
  });

  if (!label) return null;

  return (
    <div className='str-chat__channel-detail__files-view__section-header'>{label}</div>
  );
};

const getAttachmentFileName = (attachment: ChannelFileItem['attachment']) =>
  attachment.title || attachment.fallback || '';

const ChannelFileListItem = ({ item }: { item: ChannelFileItem }) => {
  const { attachment } = item;
  const fileName = getAttachmentFileName(attachment);
  const assetUrl = attachment.asset_url;
  const { file_size, mime_type } = attachment.custom;

  const LeadingSlot = useMemo(
    () =>
      function FileListItemIcon() {
        return (
          <FileIcon
            className='str-chat__channel-detail__files-view__list-item__icon'
            fileName={fileName}
            mimeType={mime_type}
            size='md'
          />
        );
      },
    [mime_type, fileName],
  );

  const sharedProps = useMemo(
    () => ({
      LeadingSlot,
      subtitle: <FileSizeIndicator fileSize={file_size} />,
      subtitleClassName: 'str-chat__channel-detail__files-view__list-item__size',
      title: fileName,
      titleClassName: 'str-chat__channel-detail__files-view__list-item__name',
    }),
    [file_size, fileName, LeadingSlot],
  );

  const linkRootProps = useMemo(
    () => ({
      className: 'str-chat__channel-detail__files-view__list-item',
      download: fileName || undefined,
      href: assetUrl,
      rel: 'noopener noreferrer',
      target: '_blank',
    }),
    [assetUrl, fileName],
  );

  const divRootProps = useMemo(
    () => ({ className: 'str-chat__channel-detail__files-view__list-item' }),
    [],
  );

  if (assetUrl) {
    return <ListItemLayout {...sharedProps} RootElement='a' rootProps={linkRootProps} />;
  }

  return <ListItemLayout {...sharedProps} RootElement='div' rootProps={divRootProps} />;
};

export type ChannelFilesViewProps = SectionNavigatorSectionContentProps;

export const ChannelFilesView: React.ComponentType<ChannelFilesViewProps> = () => {
  const { t } = useTranslationContext();
  const { close } = useModalContext();
  const { channelFilesSearchSource, fileItems, groupCounts, hasResultsLoaded, sections } =
    useChannelFilesSearch();

  const groupContent = useCallback(
    (groupIndex: number) => (
      <ChannelFilesSectionHeader timestamp={sections[groupIndex]?.timestamp} />
    ),
    [sections],
  );

  // In grouped mode the `index` passed here is the flat item index (0-based
  // across all items, excluding group headers), so it indexes `fileItems`
  // directly. We intentionally don't pass `computeItemKey`: GroupedVirtuoso
  // calls it with the absolute group+item location index (and no item data),
  // so it can't be used to look items up — the default position keys are
  // correct for this append-only list.
  const itemContent = useCallback(
    (index: number) => <ChannelFileListItem item={fileItems[index]} />,
    [fileItems],
  );

  const atBottomStateChange = useCallback(
    (atBottom: boolean) => {
      if (atBottom) channelFilesSearchSource.search();
    },
    [channelFilesSearchSource],
  );

  const EmptyPlaceholder = useMemo(
    () =>
      function ChannelFilesEmptyPlaceholder() {
        return hasResultsLoaded ? <ChannelFilesEmptyList /> : null;
      },
    [hasResultsLoaded],
  );

  const Footer = useMemo(
    () =>
      function ChannelFilesListFooter() {
        return (
          <ChannelDetailListLoadingIndicator searchSource={channelFilesSearchSource} />
        );
      },
    [channelFilesSearchSource],
  );

  const components = useMemo(
    () => ({
      EmptyPlaceholder,
      Footer,
      Group: ChannelFilesGroup,
      Item: ChannelFilesItem,
    }),
    [EmptyPlaceholder, Footer],
  );

  return (
    <div className='str-chat__channel-detail__files-view'>
      <SectionNavigatorHeader close={close} title={t('Files')} />
      <Prompt.Body className='str-chat__channel-detail__files-view__body'>
        <GroupedVirtuoso
          atBottomStateChange={atBottomStateChange}
          className='str-chat__virtualized-list str-chat__channel-detail__files-view__list'
          components={components}
          groupContent={groupContent}
          groupCounts={groupCounts}
          itemContent={itemContent}
        />
      </Prompt.Body>
    </div>
  );
};
