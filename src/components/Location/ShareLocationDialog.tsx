import React, {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useChatContext, useTranslationContext } from '../../context';
import { ContextMenuBody, ContextMenuButton, ContextMenuRoot, Prompt } from '../Dialog';
import {
  Dropdown,
  type DropdownTriggerProps,
  useDropdownContext,
} from '../Form/Dropdown';
import { IconChevronDown } from '../Icons';
import { useMessageComposer } from '../MessageInput';
import { SwitchField } from '../Form/SwitchField';
import { addNotificationTargetTag, useNotificationTarget } from '../Notifications';
import type { Coords } from 'stream-chat';
import { Button } from '../Button';
import clsx from 'clsx';

const MIN_LIVE_LOCATION_SHARE_DURATION = 60 * 1000; // 1 minute;

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
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const panel = useNotificationTarget();
  const messageComposer = useMessageComposer();
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
        ? t('duration/Share Location', {
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
    [selectedDurationLabel],
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
          { timeout: 1000 },
        );
      }),
    [],
  );

  const setupPositionWatching = useCallback(() => {
    setLoadingLocation(true);
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        setGeolocationPosition(position);
        setLoadingLocation(false);
        setGeolocationPositionError(undefined);
      },
      (error) => {
        setGeolocationPosition(null);
        setLoadingLocation(false);
        setGeolocationPositionError(error);
      },
      { timeout: 1000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watch);
    };
  }, []);

  useEffect(() => setupPositionWatching(), [setupPositionWatching]);

  const liveLocationSwitchEnabled = durations.length > 0;
  return (
    <Prompt.Root
      className='str-chat__share-location-dialog'
      data-testid='share-location-dialog'
    >
      <Prompt.Header close={close} title={t('Share Location')} />
      <Prompt.Body>
        <GeolocationMap
          geolocationPositionError={geolocationPositionError}
          latitude={geolocationPosition?.coords.latitude}
          loadingLocation={loadingLocation}
          longitude={geolocationPosition?.coords.longitude}
          restartLocationWatching={setupPositionWatching}
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
              title={t('Share live location for')}
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
            {t('Cancel')}
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
            {t('Attach')}
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
                  client.notifications.addError({
                    message: t('Failed to retrieve location'),
                    options: {
                      originalError: e instanceof Error ? e : undefined,
                      tags: addNotificationTargetTag(panel),
                      type: 'browser:location:get:failed',
                    },
                    origin: { emitter: 'ShareLocationDialog' },
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
                client.notifications.addError({
                  message: t('Failed to share location'),
                  options: {
                    originalError: err instanceof Error ? err : undefined,
                    tags: addNotificationTargetTag(panel),
                    type: 'api:location:share:failed',
                  },
                  origin: { emitter: 'ShareLocationDialog' },
                });
                return;
              }
              close();
            }}
            type='submit'
          >
            {t('Share')}
          </Prompt.FooterControlsButtonPrimary>
        </Prompt.FooterControls>
      </Prompt.Footer>
    </Prompt.Root>
  );
};

export type DurationDropdownItemsProps = {
  durations: number[];
  selectDuration: (duration: number) => void;
};
const DurationDropdownItems = ({
  durations,
  selectDuration,
}: DurationDropdownItemsProps) => {
  const { t } = useTranslationContext();
  const { close } = useDropdownContext();
  return (
    <ContextMenuRoot>
      <ContextMenuBody>
        {durations.map((duration) => (
          <ContextMenuButton
            className='str-chat__live-location-sharing-duration-option'
            key={`duration-${duration}`}
            onClick={() => {
              selectDuration(duration);
              close();
            }}
            role='option'
          >
            {t('duration/Share Location', { milliseconds: duration })}
          </ContextMenuButton>
        ))}
      </ContextMenuBody>
    </ContextMenuRoot>
  );
};
