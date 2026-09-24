import { useCallback, useMemo, useState } from 'react';
import type { MessageComposer, StreamChat } from 'stream-chat';
import { Button, useStateStore } from 'stream-chat-react';

import { readMiddlewareIds } from './composerRegistry';
import { toDebugJson } from './serialize';

/**
 * `useStateStore` shallow-compares the selected object's own keys, so selecting the whole store
 * value under a single key re-renders whenever the store publishes a new value — which is what
 * an inspector wants. Defined at module scope so its identity stays stable.
 */
const identity = (value: unknown) => ({ value });

type SectionProps = {
  children?: React.ReactNode;
  defaultOpen?: boolean;
  title: string;
  value?: unknown;
};

const Section = ({ children, defaultOpen = false, title, value }: SectionProps) => (
  <details className='app__composer-inspector__section' open={defaultOpen}>
    <summary className='app__composer-inspector__section-title'>{title}</summary>
    {children}
    {value !== undefined && (
      <pre className='app__composer-inspector__json'>{toDebugJson(value)}</pre>
    )}
  </details>
);

const Flag = ({ label, on }: { label: string; on: boolean }) => (
  <span
    className={`app__composer-inspector__flag app__composer-inspector__flag--${on ? 'on' : 'off'}`}
  >
    {label}
  </span>
);

/**
 * Everything live about one composer. Keyed by composer in the parent so switching selection
 * remounts it rather than trying to swap the subscriptions underneath.
 */
export const ComposerStateInspector = ({
  client,
  composer,
}: {
  client: StreamChat;
  composer: MessageComposer;
}) => {
  const { value: composerState } = useStateStore(composer.state, identity);
  const { value: editingAudit } = useStateStore(composer.editingAuditState, identity);
  const { value: config } = useStateStore(composer.configState, identity);
  const { value: text } = useStateStore(composer.textComposer.state, identity);
  const { value: attachmentState } = useStateStore(
    composer.attachmentManager.state,
    identity,
  );
  const { value: linkPreviews } = useStateStore(
    composer.linkPreviewsManager.state,
    identity,
  );
  const { value: poll } = useStateStore(composer.pollComposer.state, identity);
  const { value: location } = useStateStore(composer.locationComposer.state, identity);
  const { value: customData } = useStateStore(composer.customDataManager.state, identity);
  const { value: uploadState } = useStateStore(client.uploadManager.state, identity);

  const attachments = composer.attachmentManager.attachments;
  const uploads = (
    uploadState as { uploads: Record<string, { uploadProgress?: number }> }
  ).uploads;

  const middleware = useMemo(
    () => ({
      composition: readMiddlewareIds(composer.compositionMiddlewareExecutor),
      draftComposition: readMiddlewareIds(composer.draftCompositionMiddlewareExecutor),
      postUpload: readMiddlewareIds(
        composer.attachmentManager.postUploadMiddlewareExecutor,
      ),
      preUpload: readMiddlewareIds(
        composer.attachmentManager.preUploadMiddlewareExecutor,
      ),
      text: readMiddlewareIds(composer.textComposer.middlewareExecutor),
    }),
    // The chains are mutated in place by setup functions, so recompute whenever anything
    // else about the composer changed rather than only when the instance swaps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [composer, editingAudit],
  );

  const snapshot = useMemo(
    () => ({
      attachments: attachmentState,
      config,
      customData,
      editingAudit,
      identity: {
        contextType: composer.contextType,
        editedMessageId: composer.editedMessage?.id,
        tag: composer.tag,
        threadId: composer.threadId,
      },
      linkPreviews,
      location,
      middleware,
      poll,
      state: composerState,
      text,
      uploads,
    }),
    [
      attachmentState,
      composer,
      composerState,
      config,
      customData,
      editingAudit,
      linkPreviews,
      location,
      middleware,
      poll,
      text,
      uploads,
    ],
  );

  const copySnapshot = useCallback(() => {
    void navigator.clipboard?.writeText(toDebugJson(snapshot));
  }, [snapshot]);

  return (
    <div className='app__composer-inspector__body'>
      <div className='app__composer-inspector__flags'>
        <Flag label='hasSendableData' on={composer.hasSendableData} />
        {/*
          Whether a composition middleware declaring `allowsPendingUploads` is installed - the
          only way to see that the "Allow sending while attachments are still uploading" switch
          reached the composer, since nothing else about the chain is observable.
        */}
        <Flag label='allowsPendingUploads' on={composer.allowsPendingUploads} />
        <Flag label='compositionIsEmpty' on={composer.compositionIsEmpty} />
        <Flag label='contentIsEmpty' on={composer.contentIsEmpty} />
        <Flag label='isCommandSendable' on={composer.isCommandSendable} />
      </div>

      <Section defaultOpen title='Identity' value={snapshot.identity} />

      <Section defaultOpen title={`Attachments (${attachments.length})`}>
        {attachments.length === 0 ? (
          <div className='app__composer-inspector__empty'>none</div>
        ) : (
          <table className='app__composer-inspector__table'>
            <thead>
              <tr>
                <th>id</th>
                <th>type</th>
                <th>uploadState</th>
                <th>live progress</th>
                <th>preview</th>
              </tr>
            </thead>
            <tbody>
              {attachments.map((attachment) => {
                const {
                  id,
                  previewUri,
                  uploadState: state,
                } = attachment.localMetadata ?? {};
                return (
                  <tr key={id}>
                    <td title={id}>{id?.slice(0, 8)}</td>
                    <td>{attachment.type}</td>
                    <td>{state ?? '—'}</td>
                    {/* Read from uploadManager, not the attachment: the value stored on an
                        attachment carried by a message is frozen at compose time. */}
                    <td>
                      {id && uploads[id]
                        ? `${uploads[id].uploadProgress ?? '?'}%`
                        : 'no record'}
                    </td>
                    <td>{previewUri ? 'yes' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      <Section
        title={`uploadManager records (${Object.keys(uploads).length})`}
        value={uploads}
      />
      <Section title='Text composer' value={text} />
      <Section title='Composer state' value={composerState} />
      <Section title='Middleware chains' value={middleware} />
      <Section title='Link previews' value={linkPreviews} />
      <Section title='Poll composer' value={poll} />
      <Section title='Location composer' value={location} />
      <Section title='Custom data' value={customData} />
      <Section title='Editing audit' value={editingAudit} />
      <Section title='Config' value={config} />

      <Button
        appearance='outline'
        className='app__composer-inspector__copy'
        onClick={copySnapshot}
        size='sm'
        variant='secondary'
      >
        Copy snapshot JSON
      </Button>
    </div>
  );
};

/** Composer picker + the inspector for whichever is selected. */
export const ComposerStateInspectorPanel = ({
  client,
  composers,
}: {
  client: StreamChat;
  composers: { composer: MessageComposer; label: string; tag: string }[];
}) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const selected =
    composers.find(({ tag }) => tag === selectedTag) ?? composers[0] ?? undefined;

  if (!selected) {
    return (
      <div className='app__composer-inspector__empty'>
        No composer yet — open a channel.
      </div>
    );
  }

  return (
    <>
      {composers.length > 1 && (
        <select
          aria-label='Composer to inspect'
          className='app__composer-inspector__picker'
          onChange={(event) => setSelectedTag(event.target.value)}
          value={selected.tag}
        >
          {composers.map(({ label, tag }) => (
            <option key={tag} value={tag}>
              {label}
            </option>
          ))}
        </select>
      )}
      <ComposerStateInspector
        client={client}
        composer={selected.composer}
        key={selected.tag}
      />
    </>
  );
};
