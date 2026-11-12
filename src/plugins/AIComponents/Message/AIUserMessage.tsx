import React, { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { AIMessageAttachment, type AIMessageAttachmentData } from './AIMessageAttachment';
import { type AIBranchSwitch, AIBranchSwitcher } from './AIBranchSwitcher';
import { ThemeScopeProvider, useAIThemeScopeClassName } from '../themeScope';

export type AIUserMessageProps = {
  /** What the person wrote. */
  text: string;
  /** What they sent with it, such as images and files. */
  attachments?: AIMessageAttachmentData[];
  /**
   * Which of the question's versions shows, when the person edited it: a ‹ i/n › switcher with
   * arrows to the others, shown only while `count` is 2 or more.
   */
  branch?: AIBranchSwitch;
  className?: string;
  /**
   * Edits the message, such as by putting its text back in the composer. Without it or
   * `onSaveEdit`, no edit button. `onSaveEdit` takes its place when both are passed.
   */
  onEdit?: () => void;
  /**
   * Saves the person's edit of the message. With it, the edit button opens an editor in place
   * of the bubble, filled with the message's text: Save (or Enter) calls it with the new text,
   * Cancel (or Escape) closes the editor. A text that is empty, or unchanged but for the spaces
   * around it, can't be saved.
   */
  onSaveEdit?: (text: string) => void;
};

type EditorProps = {
  onCancel: () => void;
  onSave: (text: string) => void;
  text: string;
};

const AIUserMessageEditor = ({ onCancel, onSave, text }: EditorProps) => {
  const { t } = useTranslationContext();
  const [draft, setDraft] = useState(text);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);
  // Saving the text unchanged would answer it again for nothing.
  const canSave = draft.trim() !== '' && draft.trim() !== text.trim();
  const save = () => {
    if (canSave) onSave(draft);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape that ends an IME composition doesn't close the editor, nor does Enter save.
    if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onCancel();
      return;
    }
    // Shift+Enter starts a new line; Enter that ends an IME composition does not save.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      save();
    }
  };
  return (
    <div className='str-chat__ai-user-message__editor'>
      <textarea
        aria-label={t('aiComponents.userMessage.editInput.ariaLabel', 'Edit message')}
        className='str-chat__ai-user-message__editor-input'
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        ref={inputRef}
        rows={Math.min(8, Math.max(2, draft.split('\n').length))}
        value={draft}
      />
      <div className='str-chat__ai-user-message__editor-actions'>
        <button
          className='str-chat__ai-button str-chat__ai-button--secondary str-chat__ai-user-message__editor-cancel'
          onClick={onCancel}
          type='button'
        >
          {t('aiComponents.userMessage.cancelEdit.label', 'Cancel')}
        </button>
        <button
          className='str-chat__ai-button str-chat__ai-button--primary str-chat__ai-user-message__editor-save'
          disabled={!canSave}
          onClick={save}
          type='button'
        >
          {t('aiComponents.userMessage.saveEdit.label', 'Save')}
        </button>
      </div>
    </div>
  );
};

/**
 * The person's message: its attachments, then its text in a bubble on the trailing side, and a
 * ‹ i/n › switcher under it when it has several versions. With `onSaveEdit`, editing it happens
 * in place. The counterpart of `AIUserMessageView`.
 */
export const AIUserMessage = ({
  attachments = [],
  branch,
  className,
  onEdit,
  onSaveEdit,
  text,
}: AIUserMessageProps) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  const { t } = useTranslationContext();
  const { IconEdit } = useComponentContextIcons();
  const [isEditing, setIsEditing] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  // An editor left open on a version that is no longer shown would save over the wrong one.
  useEffect(() => {
    setIsEditing(false);
  }, [text, branch?.index]);
  const editing = isEditing && !!onSaveEdit;

  const closeEditor = () => {
    setIsEditing(false);
    // Back to the button that opened it, once it renders again.
    requestAnimationFrame(() => editButtonRef.current?.focus());
  };
  const startEdit = onSaveEdit ? () => setIsEditing(true) : onEdit;

  return (
    <ThemeScopeProvider>
      <div
        className={clsx(
          themeScopeClassName,
          'str-chat__ai-user-message',
          editing && 'str-chat__ai-user-message--editing',
          className,
        )}
      >
        {attachments.length > 0 && (
          <div className='str-chat__ai-user-message__attachments'>
            {attachments.map((attachment, index) => (
              <AIMessageAttachment attachment={attachment} key={index} role='user' />
            ))}
          </div>
        )}
        {editing ? (
          <AIUserMessageEditor
            onCancel={closeEditor}
            onSave={(next) => {
              closeEditor();
              onSaveEdit(next);
            }}
            text={text}
          />
        ) : (
          text !== '' && (
            <div className='str-chat__ai-user-message__row'>
              {startEdit && (
                <button
                  aria-label={t('aiComponents.userMessage.edit.ariaLabel', 'Edit')}
                  className='str-chat__ai-reply-actions__button str-chat__ai-user-message__edit'
                  onClick={startEdit}
                  ref={editButtonRef}
                  title={t('aiComponents.userMessage.edit.ariaLabel', 'Edit')}
                  type='button'
                >
                  <IconEdit />
                </button>
              )}
              <div className='str-chat__ai-user-message__bubble'>{text}</div>
            </div>
          )
        )}
        {!editing && branch && (
          <AIBranchSwitcher className='str-chat__ai-user-message__branch' {...branch} />
        )}
      </div>
    </ThemeScopeProvider>
  );
};
