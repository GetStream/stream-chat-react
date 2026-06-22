import React, { useMemo } from 'react';

import { SECTION_NAVIGATOR_LAYOUT, useSectionNavigatorContext } from './SectionNavigator';
import { useTranslationContext } from '../../../context';
import { Button } from '../../../components/Button';
import { Prompt, type PromptHeaderProps } from '../../../components/Dialog';
import { IconMenu } from '../../../components/Icons';

export type SectionNavigatorHeaderProps = Omit<PromptHeaderProps, 'LeadingContent'>;

/**
 * Generic header for content rendered inside a `SectionNavigator`. It renders a
 * `Prompt.Header` and, in the inline layout (where the navigation sidebar is not
 * shown), prepends a hamburger button that opens the navigation drawer. The
 * hamburger is omitted on nested views that already show a back button
 * (`goBack`), where it would compete with the back affordance.
 */
export const SectionNavigatorHeader = (props: SectionNavigatorHeaderProps) => {
  const { t } = useTranslationContext('SectionNavigatorHeader');
  const { layout, openNavigation } = useSectionNavigatorContext();

  const MenuButton = useMemo(() => {
    if (layout !== SECTION_NAVIGATOR_LAYOUT.inline) return undefined;
    if (props.goBack) return undefined;

    return function SectionNavigatorHeaderMenuButton() {
      return (
        <Button
          appearance='ghost'
          aria-label={t('Open menu')}
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
