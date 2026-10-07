import { useState } from 'react';
import { Button, NumericInput, SwitchField, TextInput } from 'stream-chat-react';
import {
  FAILING_FILE_NAME_PREFIX,
  type UploadDestination,
} from '../../../SendWhilePendingUploads';
import { appSettingsStore, useAppSettingsState } from '../../state';
import {
  SettingsTabBody,
  SettingsTabLayoutHeader,
} from '../SettingsTabLayoutComponents.tsx';

const uploadDestinations: { label: string; value: UploadDestination }[] = [
  { label: 'Stream', value: 'stream' },
  { label: 'Mock CDN', value: 'mock-cdn' },
  { label: 'CDN at a URL', value: 'custom-url' },
];

type ComposerTabProps = {
  close: () => void;
};

export const ComposerTab = ({ close }: ComposerTabProps) => {
  const {
    composer,
    composer: {
      customCdnUrl,
      failUploads,
      sendMessagesWithPendingUploads,
      slowUploadMs,
      slowUploads,
      uploadDestination,
    },
  } = useAppSettingsState();
  // NumericInput is a text input that also accepts '', which has no numeric equivalent, so the
  // typed value is held locally and only committed to the store once it parses.
  const [slowUploadDraft, setSlowUploadDraft] = useState(String(slowUploadMs));

  return (
    <div className='app__settings-modal__content-stack'>
      <SettingsTabLayoutHeader
        close={close}
        description='Configure experimental message composer behaviour.'
        title='Composer'
      />

      <SettingsTabBody>
        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>Pending uploads</div>
          <SwitchField
            checked={sendMessagesWithPendingUploads}
            id='send-messages-with-pending-uploads-switch'
            onChange={(event) =>
              appSettingsStore.partialNext({
                composer: {
                  ...composer,
                  sendMessagesWithPendingUploads: event.target.checked,
                },
              })
            }
            title='Allow sending while attachments are still uploading'
          />
          <div className='app__settings-modal__field-comment'>
            Off by default. When enabled, the send button stays active while an upload is
            in flight; the message is added to the list immediately with a live progress
            bar and the request is made once the upload settles. Applies to already-open
            composers — no reload needed — and to both the channel and thread composers.
          </div>
        </div>

        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>Upload destination</div>
          <div className='app__settings-modal__options-row'>
            {uploadDestinations.map(({ label, value }) => (
              <Button
                aria-pressed={uploadDestination === value}
                className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
                key={value}
                onClick={() =>
                  appSettingsStore.partialNext({
                    composer: { ...composer, uploadDestination: value },
                  })
                }
              >
                {label}
              </Button>
            ))}
          </div>
          {uploadDestination === 'custom-url' && (
            <TextInput
              id='custom-cdn-url-input'
              label='CDN upload URL'
              onChange={(event) =>
                appSettingsStore.partialNext({
                  composer: { ...composer, customCdnUrl: event.target.value.trim() },
                })
              }
              placeholder='https://cdn.example.com/upload'
              type='url'
              value={customCdnUrl}
            />
          )}
          <div className='app__settings-modal__field-comment'>
            Where attachments are uploaded. <strong>Mock CDN</strong> stores files on disk
            in <code>examples/vite/.mock-cdn</code> and serves them back from this dev
            server, so only browsers that reach it can display them; it exists only under{' '}
            <code>yarn start:vite</code> and <code>vite preview</code>, not in the
            deployed app. <strong>CDN at a URL</strong> posts each file as{' '}
            <code>multipart/form-data</code> in the <code>file</code> field and expects
            JSON <code>{'{ file, thumb_url? }'}</code> back; the CDN has to allow this
            origin (CORS). Either CDN sets <code>customCdn</code>, so Stream&apos;s upload
            permission no longer applies. Combines with the slow and failing switches
            below; applies to the next upload.
          </div>
        </div>

        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>Slow uploads</div>
          <SwitchField
            checked={slowUploads}
            id='slow-uploads-switch'
            onChange={(event) =>
              appSettingsStore.partialNext({
                composer: { ...composer, slowUploads: event.target.checked },
              })
            }
            title='Slow down uploads'
          />
          <div className='app__settings-modal__field-comment'>
            Dev harness, independent of the switch above. Uploads in this app finish in
            well under a second, so there is normally nothing to watch — this stretches
            every upload over the delay below: 60% ramping progress to 100%, then the rest
            sitting at 100% with the server response still outstanding, which is the
            window the indicator renders as indeterminate. Just as useful for watching the{' '}
            <em>default</em> behaviour, where the send button stays disabled until the
            upload finishes.
          </div>

          <NumericInput
            aria-label='Upload delay (ms)'
            className='app__upload-delay-numeric-field'
            disabled={!slowUploads}
            label='Upload delay (ms)'
            max={99999999}
            min={0}
            onChange={(event) => {
              const raw = event.target.value;
              setSlowUploadDraft(raw);
              appSettingsStore.partialNext({
                composer: { ...composer, slowUploadMs: raw === '' ? 0 : Number(raw) },
              });
            }}
            step={500}
            value={slowUploadDraft}
          />
          <div className='app__settings-modal__field-comment'>
            Takes effect on the next upload; no reload needed. Both switches reset to off
            on every page load; seed them from the URL with{' '}
            <strong>?send_messages_with_pending_uploads=1&amp;slow_upload=40000</strong> —
            a <strong>slow_upload</strong> value turns this switch on by itself.
          </div>
        </div>

        <div className='app__settings-modal__field'>
          <div className='app__settings-modal__field-label'>Failing uploads</div>
          <SwitchField
            checked={failUploads !== 'off'}
            id='fail-uploads-switch'
            onChange={(event) =>
              appSettingsStore.partialNext({
                composer: {
                  ...composer,
                  failUploads: event.target.checked ? 'all' : 'off',
                },
              })
            }
            title='Make uploads fail'
          />
          <div className='app__settings-modal__field-comment'>
            Dev harness. The upload rejects instead of completing, which is the only way
            to reach the failed-message and retry paths from the UI. Combine it with the
            delay above to send a message while the upload is still running and watch it
            fail afterwards — the rejection happens at the end of the delay, not at the
            start.
          </div>

          <div className='app__settings-modal__options-row'>
            <Button
              aria-pressed={failUploads === 'all'}
              className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
              disabled={failUploads === 'off'}
              onClick={() =>
                appSettingsStore.partialNext({
                  composer: { ...composer, failUploads: 'all' },
                })
              }
            >
              Every upload
            </Button>
            <Button
              aria-pressed={failUploads === 'prefixed'}
              className='app__settings-modal__option-button str-chat__button--outline str-chat__button--secondary str-chat__button--size-sm'
              disabled={failUploads === 'off'}
              onClick={() =>
                appSettingsStore.partialNext({
                  composer: { ...composer, failUploads: 'prefixed' },
                })
              }
            >
              Only <code>{FAILING_FILE_NAME_PREFIX}</code>&hellip; files
            </Button>
          </div>
          <div className='app__settings-modal__field-comment'>
            <strong>Every upload</strong> fails the whole message.{' '}
            <strong>
              Only <code>{FAILING_FILE_NAME_PREFIX}</code>&hellip; files
            </strong>{' '}
            fails just the attachments whose file name starts with{' '}
            <code>{FAILING_FILE_NAME_PREFIX}</code>, so a message with one good and one
            bad attachment reproduces the partial retry: resending re-uploads only the one
            that failed.
          </div>
        </div>
      </SettingsTabBody>
    </div>
  );
};
