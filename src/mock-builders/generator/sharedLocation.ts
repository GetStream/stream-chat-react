import { ts } from '../timestamps';
import type { SharedLiveLocationResponse, SharedLocationResponseData } from 'stream-chat';

export const generateStaticLocationResponse = (
  data: Partial<SharedLocationResponseData>,
): SharedLocationResponseData => ({
  channel_cid: 'channel_cid',
  created_at: ts('1970-01-01T00:00:00.000Z'),
  created_by_device_id: 'created_by_device_id',
  latitude: 1,
  longitude: 1,
  message_id: 'message_id',
  updated_at: ts('1970-01-01T00:00:00.000Z'),
  user_id: 'user_id',
  ...data,
});

export const generateLiveLocationResponse = (
  data: Partial<SharedLiveLocationResponse>,
): SharedLiveLocationResponse => ({
  channel_cid: 'channel_cid',
  created_at: ts('1970-01-01T00:00:00.000Z'),
  created_by_device_id: 'created_by_device_id',
  end_at: ts('9999-01-01T00:00:00.000Z'),
  latitude: 1,
  longitude: 1,
  message_id: 'message_id',
  updated_at: ts('1970-01-01T00:00:00.000Z'),
  user_id: 'user_id',
  ...data,
});
