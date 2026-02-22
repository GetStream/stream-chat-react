import React, {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useChatContext, useTranslationContext } from '../../context';
import { useMessageComposer } from '../MessageInput';
import { Prompt } from '../Dialog';
import { SwitchField } from '../Form/SwitchField';
import { Dropdown, useDropdownContext } from '../Form/Dropdown';
import type { Coords } from 'stream-chat';

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

export const ShareLocationDialog = ({
  close,
  GeolocationMap = DefaultGeolocationMap,
  shareDurations = DEFAULT_SHARE_LOCATION_DURATIONS,
}: ShareLocationDialogProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
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

  const openDropdownButtonProps = useMemo(
    () => ({
      children: (() => (
        <div>
          {t('duration/Share Location', {
            milliseconds: selectedDuration ?? durations[0],
          })}
        </div>
      ))(), // todo: make it a component
    }),
    [durations, selectedDuration, t],
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

  return (
    <Prompt.Root
      className='str-chat__prompt str-chat__share-location-dialog'
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
          <div className='str-chat__live-location-activation'>
            <SwitchField
              checked={durations.length > 0}
              data-testid='share-location-dialog-live-location-switch'
              disabled={!geolocationPosition}
              onChange={(e) => {
                e.stopPropagation();
                if (durations.length > 0) {
                  setDurations([]);
                  setSelectedDuration(undefined);
                } else {
                  setDurations(validShareDurations);
                  setSelectedDuration(validShareDurations[0]);
                }
              }}
              title={t('Share live location for')}
            />
            {durations.length > 0 && (
              <Dropdown
                openButtonProps={openDropdownButtonProps}
                placement='bottom-start'
              >
                <DurationDropdownItems
                  durations={durations}
                  selectDuration={setSelectedDuration}
                />
              </Dropdown>
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
          <Prompt.FooterControlsButtonPrimary
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
          </Prompt.FooterControlsButtonPrimary>
          <Prompt.FooterControlsButtonSecondary
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
                      type: 'browser-api:location:get:failed',
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
          </Prompt.FooterControlsButtonSecondary>
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
  return durations.map((duration) => (
    <button
      className='str-chat__live-location-sharing-duration-option'
      key={`duration-${duration}}`}
      onClick={() => {
        selectDuration(duration);
        close();
      }}
      role='option'
    >
      {t('duration/Share Location', { milliseconds: duration })}
    </button>
  ));
};
