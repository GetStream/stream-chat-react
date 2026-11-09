import React, {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useComponentContextIcons, useTranslationContext } from '../../context';
import { ContextMenuBody, ContextMenuButton, ContextMenuRoot, Prompt } from '../Dialog';
import {
  Dropdown,
  type DropdownTriggerProps,
  useDropdownContext,
} from '../Form/Dropdown';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import { SwitchField } from '../Form/SwitchField';
import { useNotificationApi } from '../Notifications';
import type { Coords } from 'stream-chat';
import { Button } from '../Button';
import clsx from 'clsx';

const MIN_LIVE_LOCATION_SHARE_DURATION = 60 * 1000; // 1 minute

// Time the browser gets to produce a position. A first fix (e.g. a cold GPS start)
// can take several seconds.
const GEOLOCATION_TIMEOUT_MS = 10 * 1000;

const DEFAULT_SHARE_LOCATION_DURATIONS = [
  15 * 60 * 1000, // 15 minutes
  60 * 60 * 1000, // 1 hour
  8 * 60 * 60 * 1000, // 8 hours
];

export type ShareGeolocationMapProps = Partial<Coords> & {
  loadingLocation: boolean;
  restartLocationWatching: () => void;
  geolocationPositionError?: GeolocationPositionError;
};

export type ShareLocationDialogProps = {
  close: () => void;
  shareDurations?: number[];
  GeolocationMap?: ComponentType<ShareGeolocationMapProps>;
  DurationDropdownItems?: ComponentType<DurationDropdownItemsProps>;
};

const DefaultGeolocationMap = () => null;

const LiveLocationDurationTrigger = ({
  children,
  onClick,
  referenceRef,
  ...props
}: DropdownTriggerProps) => (
  <Button
    {...props}
    className='str-chat__live-location-sharing-duration-selector__button'
    onClick={onClick}
    ref={referenceRef as React.Ref<HTMLButtonElement>}
    type='button'
  >
    {children}
  </Button>
);

export const ShareLocationDialog = ({
  close,
  GeolocationMap = DefaultGeolocationMap,
  shareDurations = DEFAULT_SHARE_LOCATION_DURATIONS,
}: ShareLocationDialogProps) => {
  const { IconChevronDown } = useComponentContextIcons();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposerController();
  const [durations, setDurations] = useState<number[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number | undefined>(undefined);
  const [geolocationPosition, setGeolocationPosition] =
    useState<GeolocationPosition | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [geolocationPositionError, setGeolocationPositionError] = useState<
    GeolocationPositionError | undefined
  >(undefined);

  const validShareDurations = useMemo(
    () => shareDurations.filter((d) => d >= MIN_LIVE_LOCATION_SHARE_DURATION),
    [shareDurations],
  );

  const selectedDurationLabel = useMemo(
    () =>
      durations.length > 0
        ? t('duration.shareLocation', {
            milliseconds: selectedDuration ?? durations[0],
          })
        : undefined,
    [durations, selectedDuration, t],
  );

  const durationTriggerProps = useMemo(
    () => ({
      children: selectedDurationLabel ? (
        <>
          <span>{selectedDurationLabel}</span>
          <IconChevronDown />
        </>
      ) : null,
    }),
    [IconChevronDown, selectedDurationLabel],
  );

  const getPosition = useCallback(
    (): Promise<GeolocationPosition> =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve(position);
          },
          (positionError) => {
            console.warn(positionError);
            reject(positionError);
          },
          { timeout: GEOLOCATION_TIMEOUT_MS },
        );
      }),
    [],
  );

  // The dialog runs at most one position watch: its id is kept here so that a restart
  // and unmount can clear it.
  const watchIdRef = useRef<number | undefined>(undefined);
  // Bumped whenever a watch stops. A callback the browser queued before clearWatch still
  // runs, and its watch's generation no longer matches, so it leaves the state alone.
  const watchGenerationRef = useRef(0);

  const stopPositionWatching = useCallback(() => {
    watchGenerationRef.current += 1;
    if (watchIdRef.current === undefined) return;
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = undefined;
  }, []);

  const startPositionWatching = useCallback(() => {
    stopPositionWatching();
    setLoadingLocation(true);
    const watchGeneration = watchGenerationRef.current;
    const isStoppedWatch = () => watchGeneration !== watchGenerationRef.current;
    let watchHasPosition = false;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (isStoppedWatch()) return;
        watchHasPosition = true;
        setGeolocationPosition(position);
        setLoadingLocation(false);
        setGeolocationPositionError(undefined);
      },
      (error) => {
        if (isStoppedWatch()) return;
        // Some browsers (e.g. Firefox) report TIMEOUT whenever a stationary device
        // produces no new position in time. The last position stays valid then.
        const isTimeoutAfterPosition = watchHasPosition && error.code === error.TIMEOUT;
        if (isTimeoutAfterPosition) return;
        setGeolocationPosition(null);
        setLoadingLocation(false);
        setGeolocationPositionError(error);
      },
      { timeout: GEOLOCATION_TIMEOUT_MS },
    );
  }, [stopPositionWatching]);

  useEffect(() => {
    startPositionWatching();
    return stopPositionWatching;
  }, [startPositionWatching, stopPositionWatching]);

  const liveLocationSwitchEnabled = durations.length > 0;
  return (
    <Prompt.Root
      className='str-chat__share-location-dialog'
      data-testid='share-location-dialog'
    >
      <Prompt.Header
        close={close}
        description={t(
          'location.shareLocationDialog.description',
          'Select your current location and optionally enable live location sharing',
        )}
        title={t('location.shareLocationDialog.shareLocation.title', 'Share Location')}
      />
      <Prompt.Body>
        <GeolocationMap
          geolocationPositionError={geolocationPositionError}
          latitude={geolocationPosition?.coords.latitude}
          loadingLocation={loadingLocation}
          longitude={geolocationPosition?.coords.longitude}
          restartLocationWatching={startPositionWatching}
        />
        {validShareDurations.length > 0 && (
          <div
            className={clsx('str-chat__live-location-activation', {
              'str-chat__live-location-activation--expanded': liveLocationSwitchEnabled,
            })}
          >
            <SwitchField
              checked={liveLocationSwitchEnabled}
              data-testid='share-location-dialog-live-location-switch'
              disabled={!geolocationPosition}
              onChange={(e) => {
                e.stopPropagation();
                if (liveLocationSwitchEnabled) {
                  setDurations([]);
                  setSelectedDuration(undefined);
                } else {
                  setDurations(validShareDurations);
                  setSelectedDuration(validShareDurations[0]);
                }
              }}
              title={t(
                'location.shareLocationDialog.shareLiveLocation.title',
                'Share live location for',
              )}
            />
            {liveLocationSwitchEnabled && selectedDurationLabel && (
              <div className='str-chat__live-location-sharing-duration-selector'>
                <Dropdown
                  placement='bottom-start'
                  TriggerComponent={LiveLocationDurationTrigger}
                  triggerProps={durationTriggerProps}
                >
                  <DurationDropdownItems
                    durations={durations}
                    selectDuration={setSelectedDuration}
                    selectedDuration={selectedDuration}
                  />
                </Dropdown>
              </div>
            )}
          </div>
        )}
      </Prompt.Body>
      <Prompt.Footer>
        <Prompt.FooterControls>
          <Prompt.FooterControlsButtonSecondary
            className='str-chat__prompt__footer__controls-button--cancel'
            onClick={() => {
              messageComposer.locationComposer.initState();
              close();
            }}
          >
            {t('common.cancel.label', 'Cancel')}
          </Prompt.FooterControlsButtonSecondary>
          <Prompt.FooterControlsButtonSecondary
            className='str-chat__prompt__footer__controls-button--submit'
            disabled={!geolocationPosition}
            onClick={async () => {
              let coords = geolocationPosition && {
                latitude: geolocationPosition.coords.latitude,
                longitude: geolocationPosition.coords.longitude,
              };
              if (!coords) {
                coords = (await getPosition()).coords;
              }
              messageComposer.locationComposer.setData({
                ...coords,
                durationMs: selectedDuration,
              });
              close();
            }}
            type='submit'
          >
            {t('location.shareLocationDialog.attach.text', 'Attach')}
          </Prompt.FooterControlsButtonSecondary>
          <Prompt.FooterControlsButtonPrimary
            className='str-chat__prompt__footer__controls-button--submit'
            disabled={!geolocationPosition}
            onClick={async () => {
              let coords = geolocationPosition && {
                latitude: geolocationPosition.coords.latitude,
                longitude: geolocationPosition.coords.longitude,
              };
              if (!coords) {
                try {
                  coords = (await getPosition()).coords;
                } catch (e) {
                  addNotification({
                    emitter: 'ShareLocationDialog',
                    error: e instanceof Error ? e : undefined,
                    message: t(
                      'notification.locationGetFailed',
                      'Failed to retrieve location',
                    ),
                    severity: 'error',
                    type: 'browser:location:get:failed',
                  });
                  return;
                }
              }

              messageComposer.locationComposer.setData({
                ...coords,
                durationMs: selectedDuration,
              });
              try {
                await messageComposer.sendLocation();
              } catch (err) {
                addNotification({
                  emitter: 'ShareLocationDialog',
                  error: err instanceof Error ? err : undefined,
                  message: t(
                    'notification.locationShareFailed',
                    'Failed to share location',
                  ),
                  severity: 'error',
                  type: 'api:location:share:failed',
                });
                return;
              }
              close();
            }}
            type='submit'
          >
            {t('location.shareLocationDialog.share.text', 'Share')}
          </Prompt.FooterControlsButtonPrimary>
        </Prompt.FooterControls>
      </Prompt.Footer>
    </Prompt.Root>
  );
};

export type DurationDropdownItemsProps = {
  durations: number[];
  selectedDuration?: number;
  selectDuration: (duration: number) => void;
};
const DurationDropdownItems = ({
  durations,
  selectDuration,
  selectedDuration,
}: DurationDropdownItemsProps) => {
  const { t } = useTranslationContext();
  const { close } = useDropdownContext();
  return (
    <ContextMenuRoot>
      <ContextMenuBody>
        {durations.map((duration) => (
          <ContextMenuButton
            aria-checked={selectedDuration === duration}
            className='str-chat__live-location-sharing-duration-option'
            key={`duration-${duration}`}
            onClick={() => {
              selectDuration(duration);
              close();
            }}
            role='menuitemradio'
          >
            {t('duration.shareLocation', { milliseconds: duration })}
          </ContextMenuButton>
        ))}
      </ContextMenuBody>
    </ContextMenuRoot>
  );
};
