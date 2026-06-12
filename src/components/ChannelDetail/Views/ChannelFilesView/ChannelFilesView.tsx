import React from 'react';

import { useModalContext, useTranslationContext } from '../../../../context';
import { getDateString } from '../../../../i18n/utils';
import { FileSizeIndicator } from '../../../Attachment/components/FileSizeIndicator';
import { Prompt } from '../../../Dialog';
import { FileIcon } from '../../../FileIcon';
import { InfiniteScrollPaginator } from '../../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { ListItemLayout } from '../../../ListItemLayout';
import {
  SectionNavigatorHeader,
  type SectionNavigatorSectionContentProps,
} from '../../../SectionNavigator';
import { ChannelDetailListLoadingIndicator } from '../../ChannelDetailListLoadingIndicator';
import { ChannelFilesEmptyList } from './ChannelFilesEmptyList';
import type { ChannelFileItem } from './ChannelFilesView.utils';
import { useChannelFilesSearch } from './useChannelFilesSearch';

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

  const FileListItemIcon = () => (
    <FileIcon
      className='str-chat__channel-detail__files-view__list-item__icon'
      fileName={fileName}
      mimeType={attachment.mime_type}
      size='md'
    />
  );

  const sharedProps = {
    LeadingSlot: FileListItemIcon,
    subtitle: <FileSizeIndicator fileSize={attachment.file_size} />,
    subtitleClassName: 'str-chat__channel-detail__files-view__list-item__size',
    title: fileName,
    titleClassName: 'str-chat__channel-detail__files-view__list-item__name',
  };

  if (assetUrl) {
    return (
      <ListItemLayout
        {...sharedProps}
        RootElement='a'
        rootProps={{
          className: 'str-chat__channel-detail__files-view__list-item',
          download: fileName || undefined,
          href: assetUrl,
          rel: 'noopener noreferrer',
          target: '_blank',
        }}
      />
    );
  }

  return (
    <ListItemLayout
      {...sharedProps}
      RootElement='div'
      rootProps={{ className: 'str-chat__channel-detail__files-view__list-item' }}
    />
  );
};

export type ChannelFilesViewProps = SectionNavigatorSectionContentProps;

export const ChannelFilesView: React.ComponentType<ChannelFilesViewProps> = () => {
  const { t } = useTranslationContext();
  const { close } = useModalContext();
  const { channelFilesSearchSource, fileGroups, hasResultsLoaded } =
    useChannelFilesSearch();

  return (
    <div className='str-chat__channel-detail__files-view'>
      <SectionNavigatorHeader close={close} title={t('Files')} />
      <Prompt.Body className='str-chat__channel-detail__files-view__body'>
        <InfiniteScrollPaginator
          className='str-chat__channel-detail__files-view__list'
          loadNextOnScrollToBottom={channelFilesSearchSource.search}
        >
          {fileGroups.length > 0 ? (
            fileGroups.map((group) => (
              <section
                className='str-chat__channel-detail__files-view__section'
                key={group.key}
              >
                <ChannelFilesSectionHeader timestamp={group.timestamp} />
                <div className='str-chat__channel-detail__files-view__section-items'>
                  {group.items.map((item) => (
                    <ChannelFileListItem item={item} key={item.id} />
                  ))}
                </div>
              </section>
            ))
          ) : hasResultsLoaded ? (
            <ChannelFilesEmptyList />
          ) : null}
          <ChannelDetailListLoadingIndicator searchSource={channelFilesSearchSource} />
        </InfiniteScrollPaginator>
      </Prompt.Body>
    </div>
  );
};
