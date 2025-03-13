import type { RecordedMediaType } from '../../ReactFileUtilities';
import type { ChangeEvent } from 'react';
import { Subscription } from '../observable/Subscription';
import { Subject } from '../observable/Subject';
import { BehaviorSubject } from '../observable/BehaviorSubject';

export enum RecordingPermission {
  CAM = 'camera',
  MIC = 'microphone',
}

const MEDIA_TO_PERMISSION: Record<RecordedMediaType, RecordingPermission> = {
  audio: RecordingPermission.MIC,
  video: RecordingPermission.CAM,
};

export type BrowserPermissionOptions = {
  mediaType: RecordedMediaType;
};

export class BrowserPermission {
  name: string;
  state = new BehaviorSubject<PermissionState | undefined>(undefined);
  status = new BehaviorSubject<PermissionStatus | undefined>(undefined);
  error = new Subject<Error | undefined>();

  private changeSubscriptions: Subscription[] = [];

  constructor({ mediaType }: BrowserPermissionOptions) {
    this.name = MEDIA_TO_PERMISSION[mediaType];
  }

  get isWatching() {
    return this.changeSubscriptions.some((subscription) => !subscription.closed);
  }

  async watch() {
    if (!this.status.value) {
      await this.check();
      if (!this.status.value) return;
    }

    const status = this.status.value;
    const handlePermissionChange = (e: Event) => {
      const { state } = (e as unknown as ChangeEvent<PermissionStatus>).target;
      this.state.next(state);
    };
    status.addEventListener('change', handlePermissionChange);

    this.changeSubscriptions.push(
      new Subscription(() => {
        status.removeEventListener('change', handlePermissionChange);
      }),
    );
  }

  unwatch() {
    this.changeSubscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  async check() {
    if (!this.name) {
      this.error.next(new Error('Unknown media recording permission'));
      return;
    }

    let permissionState: PermissionState;
    try {
      const permissionStatus = await navigator.permissions.query({
        name: this.name as unknown as PermissionName,
      });
      permissionState = permissionStatus.state;
      this.status.next(permissionStatus);
    } catch (e) {
      // permission does not exist - cannot be queried
      // an example would be Firefox - camera, neither microphone perms can be queried
      permissionState = 'granted' as PermissionState;
    }
    this.state.next(permissionState);
  }
}
