import type { DefaultMessageComposerPreviewType } from 'stream-chat-react';

import {
  PREVIEW_SECTION_INFO,
  resolvePreviewSectionOrder,
} from '../../../ComposerPreviews/previewSections';
import { appSettingsStore, useAppSettingsState } from '../../state';
import { SortableSectionList } from '../SortableSectionList';

/** The composer's preview sections, to drag into order and switch on or off. */
export const PreviewSectionsField = () => {
  const { composer } = useAppSettingsState();
  const { disabledPreviewSections } = composer;

  return (
    <SortableSectionList
      ariaLabel='Composer preview sections'
      disabledTypes={disabledPreviewSections}
      idPrefix='composer-preview-section'
      onEnabledChange={(type, enabled) =>
        appSettingsStore.partialNext({
          composer: {
            ...composer,
            disabledPreviewSections: enabled
              ? disabledPreviewSections.filter((disabled) => disabled !== type)
              : [...disabledPreviewSections, type],
          },
        })
      }
      onOrderChange={(previewSectionOrder) =>
        appSettingsStore.partialNext({ composer: { ...composer, previewSectionOrder } })
      }
      sections={resolvePreviewSectionOrder(composer.previewSectionOrder).map((type) => {
        const { label, removes } =
          PREVIEW_SECTION_INFO[type as DefaultMessageComposerPreviewType];
        return {
          description: (
            <>
              <code>{type}</code>. Removing it also removes: {removes}
            </>
          ),
          label,
          type,
        };
      })}
    />
  );
};
