import React, { useMemo } from 'react';

import { SECTION_NAVIGATOR_LAYOUT, useSectionNavigatorContext } from './SectionNavigator';
import { useComponentContextIcons, useTranslationContext } from '../../../context';
import { Button } from '../../../components/Button';
import { Prompt, type PromptHeaderProps } from '../../../components/Dialog';

export type SectionNavigatorHeaderProps = Omit<PromptHeaderProps, 'LeadingContent'>;

/**
 * Header for `SectionNavigator` content: a `Prompt.Header` that gets a hamburger button opening the
 * navigation drawer in the inline layout (no sidebar). The button is omitted when `goBack` is set,
 * so it does not compete with the back button.
 */
export const SectionNavigatorHeader = (props: SectionNavigatorHeaderProps) => {
  const { t } = useTranslationContext();
  const { layout, openNavigation } = useSectionNavigatorContext();

  const MenuButton = useMemo(() => {
    if (layout !== SECTION_NAVIGATOR_LAYOUT.inline) return undefined;
    if (props.goBack) return undefined;

    return function SectionNavigatorHeaderMenuButton() {
      const { IconMenu } = useComponentContextIcons();
      return (
        <Button
          appearance='ghost'
          aria-label={t(
            'channelDetail.sectionNavigatorHeader.openMenu.ariaLabel',
            'Open menu',
          )}
          circular
          className='str-chat__section-navigator__header-menu-button'
          onClick={openNavigation}
          size='md'
          variant='secondary'
        >
          <IconMenu />
        </Button>
      );
    };
  }, [layout, openNavigation, props.goBack, t]);

  return <Prompt.Header {...props} LeadingContent={MenuButton} />;
};
