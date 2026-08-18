import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Notification, StreamChat } from 'stream-chat';
import {
  NotificationList,
  Prompt,
  useChatContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
  useNotificationApi,
} from 'stream-chat-react';

import { DraggableDialog } from '../DraggableDialog';
import { SearchableSelect, type SearchableSelectOption } from '../../SearchableSelect';
import { createServerSideClient, verifyServerSideClient } from './serverSideClient';
import {
  type ChannelMemberSummary,
  fetchChannelMembers,
  findMethod,
  formatPayloadTemplate,
  getMethodsForEntity,
  MEMBER_USER_ID_KEY,
  serverSideEntities,
  type ServerSideEntity,
} from './serverSideMethods';

export const serverSideClientPromptDialogId = 'app-server-side-client-prompt-dialog';

const serverSideClientEmitter = 'vite-preview/ServerSideClientPromptDialog';

const isServerSideClientNotification = (notification: Notification) =>
  notification.origin?.emitter === serverSideClientEmitter;

const toMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const Field = ({
  children,
  hint,
  label,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
}) => (
  <div className='app__server-client-dialog__field'>
    <span className='app__server-client-dialog__field-label'>{label}</span>
    {children}
    {hint && <p className='app__server-client-dialog__note'>{hint}</p>}
  </div>
);

const StepHeading = ({ index, title }: { index: number; title: string }) => (
  <div className='app__server-client-dialog__step-heading'>
    <span className='app__server-client-dialog__step-index'>{index}</span>
    <span>{title}</span>
  </div>
);

const entityOptions: SearchableSelectOption<ServerSideEntity>[] = serverSideEntities.map(
  ({ label, value }) => ({ label, value }),
);

export const ServerSideClientPromptDialog = ({
  referenceElement,
}: {
  referenceElement: HTMLElement | null;
}) => {
  const { client: appClient } = useChatContext();
  const { addNotification } = useNotificationApi();
  const { dialog, dialogManager } = useDialogOnNearestManager({
    id: serverSideClientPromptDialogId,
  });
  const dialogIsOpen = useDialogIsOpen(serverSideClientPromptDialogId, dialogManager?.id);

  const [secret, setSecret] = useState('');
  const [entity, setEntity] = useState<ServerSideEntity>('channel');
  const [cid, setCid] = useState('');
  const [methodId, setMethodId] = useState('');
  const [payload, setPayload] = useState('');

  const [isRunning, setIsRunning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [secretCheck, setSecretCheck] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const [fetchedMembers, setFetchedMembers] = useState<ChannelMemberSummary[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // A server-side client is stateless — no WS, no session — so it is just a token-signing wrapper
  // around REST calls. Cached per secret purely to avoid re-signing on every Run.
  const clientCacheRef = useRef<{ client: StreamChat; secret: string } | null>(null);

  const methods = useMemo(() => getMethodsForEntity(entity), [entity]);
  const selectedMethod = useMemo(() => findMethod(methodId), [methodId]);
  const methodOptions = useMemo<SearchableSelectOption<string>[]>(
    () => methods.map((method) => ({ label: method.label, value: method.id })),
    [methods],
  );

  // Channels the client has loaded. Recomputed each time the dialog opens rather than subscribed
  // to — `activeChannels` is a plain record with no change notification, and a debugging dialog
  // does not need it live. `allowCustomValue` covers anything not in the list.
  const channelOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    if (!dialogIsOpen) return [];

    return Object.values(appClient.activeChannels)
      .map((activeChannel) => activeChannel.cid)
      .filter((activeChannelCid): activeChannelCid is string => !!activeChannelCid)
      .sort((left, right) => left.localeCompare(right))
      .map((activeChannelCid) => ({
        label: activeChannelCid,
        value: activeChannelCid,
      }));
  }, [appClient, dialogIsOpen]);

  const localMembers = useMemo<ChannelMemberSummary[]>(() => {
    if (!dialogIsOpen || !cid) return [];

    const members = appClient.activeChannels[cid]?.state?.members ?? {};

    return Object.values(members)
      .map((member) => ({
        name: member.user?.name,
        userId: member.user_id ?? member.user?.id ?? '',
      }))
      .filter((member) => !!member.userId);
  }, [appClient, cid, dialogIsOpen]);

  const memberOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    // Server results win on collision — they are the authoritative copy.
    const byUserId = new Map<string, ChannelMemberSummary>();
    [...localMembers, ...fetchedMembers].forEach((member) => {
      byUserId.set(member.userId, member);
    });

    return [...byUserId.values()]
      .map(({ name, userId }) => ({
        label: name ? `${name} — ${userId}` : userId,
        value: userId,
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [fetchedMembers, localMembers]);

  // The payload is the single source of truth for `user_id`, so the picker reads its value back
  // out of the JSON. A hand-edited id shows up as the selection, and the two cannot drift apart.
  const payloadUserId = useMemo(() => {
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      const value = parsed?.[MEMBER_USER_ID_KEY];

      return typeof value === 'string' ? value : '';
    } catch {
      return '';
    }
  }, [payload]);

  const resetState = useCallback(() => {
    setSecret('');
    setEntity('channel');
    setCid('');
    setMethodId('');
    setPayload('');
    setIsRunning(false);
    setIsChecking(false);
    setSecretCheck(null);
    setResult(null);
    setRunError(null);
    setFetchedMembers([]);
    setIsFetchingMembers(false);
    setMemberError(null);
    clientCacheRef.current = null;
  }, []);

  // Drops the secret and the cached privileged client as soon as the dialog closes.
  useEffect(() => {
    if (dialogIsOpen) return;
    resetState();
  }, [dialogIsOpen, resetState]);

  // A new secret invalidates the cached client and any previous check result.
  useEffect(() => {
    clientCacheRef.current = null;
    setSecretCheck(null);
  }, [secret]);

  // Server-fetched members belong to one CID; changing channel makes them wrong.
  useEffect(() => {
    setFetchedMembers([]);
    setMemberError(null);
  }, [cid]);

  // Selecting a different entity invalidates the method and its payload template.
  useEffect(() => {
    setMethodId('');
    setPayload('');
    setResult(null);
    setRunError(null);
  }, [entity]);

  const getServerClient = useCallback(async () => {
    const trimmedSecret = secret.trim();

    if (!trimmedSecret) throw new Error('Enter the API secret first.');

    if (clientCacheRef.current?.secret === trimmedSecret) {
      return clientCacheRef.current.client;
    }

    const client = await createServerSideClient({
      apiKey: appClient.key,
      secret: trimmedSecret,
    });
    clientCacheRef.current = { client, secret: trimmedSecret };

    return client;
  }, [appClient.key, secret]);

  // Optional convenience: confirms the secret is right before you bother composing a payload.
  const checkSecret = useCallback(async () => {
    setIsChecking(true);
    setSecretCheck(null);
    try {
      await verifyServerSideClient(await getServerClient());
      setSecretCheck('Secret accepted.');
    } catch (error) {
      setSecretCheck(toMessage(error));
    } finally {
      setIsChecking(false);
    }
  }, [getServerClient]);

  const loadMembers = useCallback(async () => {
    setIsFetchingMembers(true);
    setMemberError(null);
    try {
      const members = await fetchChannelMembers({
        cid: cid.trim(),
        client: await getServerClient(),
      });
      setFetchedMembers(members);

      if (!members.length) setMemberError('That channel reported no members.');
    } catch (error) {
      setMemberError(toMessage(error));
    } finally {
      setIsFetchingMembers(false);
    }
  }, [cid, getServerClient]);

  // Writes the picked id into the payload rather than holding it in separate state. Overwrites any
  // existing `user_id` — picking a member is the more deliberate action of the two.
  const selectMember = useCallback((userId: string) => {
    setPayload((current) => {
      try {
        const parsed = JSON.parse(current) as Record<string, unknown>;

        return `${JSON.stringify({ ...parsed, [MEMBER_USER_ID_KEY]: userId }, null, 2)}\n`;
      } catch {
        // Mid-edit invalid JSON — leave the textarea untouched rather than destroying work.
        setMemberError(
          'The payload is not valid JSON right now, so `user_id` was left alone.',
        );
        return current;
      }
    });
  }, []);

  const selectMethod = useCallback((nextMethodId: string) => {
    setMethodId(nextMethodId);
    setResult(null);
    setRunError(null);

    const method = findMethod(nextMethodId);
    setPayload(method ? formatPayloadTemplate(method.payloadTemplate) : '');
  }, []);

  const resetPayload = useCallback(() => {
    if (!selectedMethod) return;
    setPayload(formatPayloadTemplate(selectedMethod.payloadTemplate));
    setResult(null);
    setRunError(null);
  }, [selectedMethod]);

  const run = useCallback(async () => {
    if (!selectedMethod) return;

    setIsRunning(true);
    setResult(null);
    setRunError(null);

    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(payload);
      } catch (error) {
        throw new Error(`Payload is not valid JSON — ${toMessage(error)}`);
      }

      const response = await selectedMethod.invoke({
        cid: entity === 'channel' ? cid.trim() : undefined,
        client: await getServerClient(),
        payload: parsed,
      });

      setResult(JSON.stringify(response, null, 2));
      addNotification({
        duration: 4000,
        emitter: serverSideClientEmitter,
        incident: {
          domain: 'api',
          entity: selectedMethod.entity,
          operation: selectedMethod.id,
          status: 'success',
        },
        message: `${selectedMethod.id} succeeded`,
        severity: 'success',
        targetPanels: ['modal'],
      });
    } catch (error) {
      const message = toMessage(error);
      setRunError(message);
      addNotification({
        // Stays until dismissed — a failure message is worth reading.
        duration: 0,
        emitter: serverSideClientEmitter,
        error: error instanceof Error ? error : new Error(message),
        incident: {
          domain: 'api',
          entity: selectedMethod.entity,
          operation: selectedMethod.id,
          status: 'failed',
        },
        message: `${selectedMethod.id} failed — ${message}`,
        severity: 'error',
        targetPanels: ['modal'],
      });
    } finally {
      setIsRunning(false);
    }
  }, [addNotification, cid, entity, getServerClient, payload, selectedMethod]);

  const hasSecret = !!secret.trim();
  const needsCid = entity === 'channel';
  const canRun =
    hasSecret && !!selectedMethod && !isRunning && (!needsCid || !!cid.trim());

  return (
    <DraggableDialog
      dialogClassName='app__server-client-dialog'
      dialogId={serverSideClientPromptDialogId}
      dialogIsOpen={dialogIsOpen}
      dialogManagerId={dialogManager?.id}
      dragHandleClassName='app__server-client-dialog__drag-handle'
      onClose={dialog.close}
      promptClassName='app__server-client-dialog__prompt'
      referenceElement={referenceElement}
      shellClassName='app__server-client-dialog__shell'
      title='Server-side Client'
    >
      <Prompt.Body className='app__server-client-dialog__body'>
        <div className='app__server-client-dialog__body-scroll'>
          <p className='app__server-client-dialog__warning'>
            An API secret grants full admin access to the app. This dialog is a local
            debugging aid — the secret stays in memory for as long as it is open and is
            never persisted. Never put a secret in a production bundle.
          </p>

          <section className='app__server-client-dialog__step'>
            <StepHeading index={1} title='API secret' />
            <Field label={`Secret for app ${appClient.key}`}>
              {/* Deliberately `type="text"` masked with `-webkit-text-security`, not a real
                  password field: 1Password decorates any `type="password"` input and its injected
                  UI steals focus on the first keystroke, which closes undocked Chrome DevTools.
                  The value is still never persisted. */}
              <input
                autoComplete='off'
                className='app__server-client-dialog__text-input app__server-client-dialog__secret-input'
                data-1p-ignore
                data-bwignore
                data-form-type='other'
                data-lpignore='true'
                onChange={(event) => setSecret(event.target.value)}
                placeholder='Your Stream app secret'
                spellCheck={false}
                type='text'
                value={secret}
              />
            </Field>
            <div className='app__server-client-dialog__inline-actions'>
              <Prompt.FooterControlsButtonSecondary
                disabled={!hasSecret || isChecking}
                onClick={checkSecret}
              >
                {isChecking ? 'Checking…' : 'Check secret'}
              </Prompt.FooterControlsButtonSecondary>
              {secretCheck && (
                <span className='app__server-client-dialog__note'>{secretCheck}</span>
              )}
            </div>
            <p className='app__server-client-dialog__note'>
              No connection is opened — a server-side client is stateless. The secret only
              signs a <code>{'{ "server": true }'}</code> JWT attached to each REST call.
              &ldquo;Check secret&rdquo; is optional; it just calls{' '}
              <code>getAppSettings</code> so a wrong secret shows up here rather than on
              Run.
            </p>
          </section>

          <section className='app__server-client-dialog__step'>
            <StepHeading index={2} title='Entity' />
            <Field label='Entity type'>
              <SearchableSelect
                onChange={setEntity}
                options={entityOptions}
                searchPlaceholder='Search entities'
                value={entity}
              />
            </Field>
            {needsCid && (
              <Field
                hint='Lists the channels this client has loaded. Type any other CID to target a channel that is not in the list.'
                label='Channel CID'
              >
                <SearchableSelect
                  allowCustomValue
                  emptyLabel='Select a channel…'
                  onChange={setCid}
                  options={channelOptions}
                  searchPlaceholder='Search channels or type a CID'
                  value={cid}
                />
              </Field>
            )}
          </section>

          <section className='app__server-client-dialog__step'>
            <StepHeading index={3} title='Method' />
            <Field
              hint={selectedMethod?.description}
              label={`Method (${methods.length} available)`}
            >
              <SearchableSelect
                emptyLabel={methods.length ? 'Select a method…' : 'No methods registered'}
                onChange={selectMethod}
                options={methodOptions}
                searchPlaceholder='Search methods'
                value={methodId}
              />
            </Field>
          </section>

          <section className='app__server-client-dialog__step'>
            <StepHeading index={4} title='Payload' />
            {selectedMethod?.targetsMember && (
              <Field
                hint={`Writes \`${MEMBER_USER_ID_KEY}\` into the payload below. Lists members of the selected channel that this app has already loaded — fetch the rest with the button, or type a raw user id.`}
                label='Member'
              >
                <SearchableSelect
                  allowCustomValue
                  emptyLabel='Select a member…'
                  onChange={selectMember}
                  options={memberOptions}
                  searchPlaceholder='Search members or type a user id'
                  value={payloadUserId}
                />
                <div className='app__server-client-dialog__inline-actions'>
                  <Prompt.FooterControlsButtonSecondary
                    disabled={!hasSecret || !cid.trim() || isFetchingMembers}
                    onClick={loadMembers}
                  >
                    {isFetchingMembers ? 'Fetching…' : 'Fetch members'}
                  </Prompt.FooterControlsButtonSecondary>
                  <span className='app__server-client-dialog__note'>
                    {memberOptions.length
                      ? `${memberOptions.length} member${memberOptions.length === 1 ? '' : 's'} listed`
                      : 'No members loaded yet'}
                  </span>
                </div>
                {memberError && (
                  <p className='app__server-client-dialog__error'>{memberError}</p>
                )}
              </Field>
            )}
            <textarea
              className='app__server-client-dialog__textarea'
              disabled={!selectedMethod}
              onChange={(event) => setPayload(event.target.value)}
              rows={10}
              spellCheck={false}
              value={payload}
            />
            {runError && <p className='app__server-client-dialog__error'>{runError}</p>}
            {result && <pre className='app__server-client-dialog__result'>{result}</pre>}
          </section>
        </div>
      </Prompt.Body>
      <Prompt.Footer className='app__server-client-dialog__footer'>
        <Prompt.FooterControls className='app__server-client-dialog__footer-controls'>
          <Prompt.FooterControlsButtonSecondary
            disabled={!selectedMethod}
            onClick={resetPayload}
          >
            Reset payload
          </Prompt.FooterControlsButtonSecondary>
          <Prompt.FooterControlsButtonSecondary onClick={dialog.close}>
            Close
          </Prompt.FooterControlsButtonSecondary>
          <Prompt.FooterControlsButtonPrimary disabled={!canRun} onClick={run}>
            {isRunning ? 'Running…' : 'Run'}
          </Prompt.FooterControlsButtonPrimary>
        </Prompt.FooterControls>
      </Prompt.Footer>
      {/* Run outcomes surface inside this dialog rather than over the channel. Scoped by emitter:
          the `panel='modal'` pre-filter did not match even with a `target:modal` tag, and filtering
          on our own emitter is the more precise contract anyway. Emitting with
          `targetPanels: ['modal']` is what keeps the channel's own list from showing them. */}
      <div className='app__server-client-dialog__notifications'>
        <NotificationList filter={isServerSideClientNotification} />
      </div>
    </DraggableDialog>
  );
};
