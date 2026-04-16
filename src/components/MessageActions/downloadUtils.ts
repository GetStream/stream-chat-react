import {
  type Attachment,
  isAudioAttachment,
  isFileAttachment,
  isImageAttachment,
  isVideoAttachment,
  isVoiceRecordingAttachment,
  type LocalAttachment,
  type LocalUploadAttachment,
} from 'stream-chat';

/**
 * Download behavior notes:
 *
 * - Remote attachments prefer `fetch -> blob -> objectURL` instead of direct link clicks.
 * - In Chromium, direct sequential clicks on cross-origin URLs can yield only one actual
 *   downloaded file even when multiple anchor clicks are fired.
 * - Blob URLs are same-document downloads and preserve caller-provided `a.download` names
 *   more reliably than direct remote URLs.
 * - If remote fetch fails (e.g. CORS/policy/network), the code falls back to direct URL
 *   download so the action remains functional.
 */
export type DownloadableAttachment = {
  asset_url?: string;
  image_url?: string;
  localMetadata?: LocalUploadAttachment['localMetadata'];
  title?: string;
};

export const isDownloadableAttachment = (
  attachment: unknown,
): attachment is DownloadableAttachment => {
  if (!attachment || typeof attachment !== 'object') return false;
  const typedAttachment = attachment as Attachment | LocalAttachment;

  return (
    isFileAttachment(typedAttachment) ||
    isImageAttachment(typedAttachment) ||
    isVideoAttachment(typedAttachment) ||
    isAudioAttachment(typedAttachment) ||
    isVoiceRecordingAttachment(typedAttachment)
  );
};

const triggerUrlDownload = ({
  filename,
  openInNewTab,
  revokeObjectUrl,
  url,
}: {
  openInNewTab?: boolean;
  revokeObjectUrl?: boolean;
  url: string;
  filename: string;
}) => {
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = url;
  anchor.rel = 'noopener noreferrer';
  // Keep chat in place for direct remote URLs by opening in a new tab when requested.
  if (openInNewTab && !url.startsWith('blob:')) {
    anchor.target = '_blank';
  }
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  // Revoke object URLs by default; direct network URLs are never revoked.
  const shouldRevokeObjectUrl = revokeObjectUrl ?? url.startsWith('blob:');
  if (shouldRevokeObjectUrl && url.startsWith('blob:')) {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
};

const fetchRemoteAttachmentAsObjectUrl = async (url: string) => {
  if (typeof fetch !== 'function') return null;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch attachment, status ${response.status}`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const downloadAttachment = async (
  attachment: DownloadableAttachment,
  options: { openRemoteInNewTab?: boolean; preferRemoteFetch?: boolean } = {},
) => {
  const { openRemoteInNewTab = true, preferRemoteFetch = true } = options;
  const titleFallback = attachment.title ?? 'downloaded-attachment';
  const rawFile = attachment.localMetadata?.file;

  if (rawFile instanceof Blob) {
    const filename =
      rawFile instanceof File && rawFile.name ? rawFile.name : titleFallback;
    triggerUrlDownload({
      filename,
      url: URL.createObjectURL(rawFile),
    });
    return;
  }

  const filename =
    rawFile &&
    typeof rawFile === 'object' &&
    'name' in rawFile &&
    typeof (rawFile as { name: unknown }).name === 'string'
      ? (rawFile as { name: string }).name
      : titleFallback;

  const url = attachment.asset_url ?? attachment.image_url;
  if (!url) return;

  // Prefer blob-based download for remote files when requested.
  if (preferRemoteFetch) {
    try {
      const objectUrl = await fetchRemoteAttachmentAsObjectUrl(url);
      if (objectUrl) {
        triggerUrlDownload({
          filename,
          url: objectUrl,
        });
        return;
      }
    } catch {
      // Fall back to direct URL download when fetch is blocked (e.g. CORS/policy).
    }
  }

  triggerUrlDownload({ filename, openInNewTab: openRemoteInNewTab, url });
};

export const downloadAllAttachments = async (attachments: DownloadableAttachment[]) => {
  // Sequential execution keeps user intent clear and avoids bursting simultaneous requests.
  for (const attachment of attachments) {
    await downloadAttachment(attachment, {
      openRemoteInNewTab: true,
      preferRemoteFetch: true,
    });
  }
};
