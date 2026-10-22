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
  // A direct remote URL opens in a new tab when requested, so the chat stays in place.
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

/**
 * Downloads an attachment from its local file when it has one, otherwise from its URL. A remote
 * URL is fetched into a blob first, because sequential direct clicks on cross-origin URLs can
 * yield a single file in Chromium and blob URLs keep the `a.download` name more reliably. When
 * the fetch fails (e.g. CORS), the URL is downloaded directly.
 *
 * @param attachment - Attachment to download. Does nothing without a local file or URL.
 * @param options.openRemoteInNewTab - Open a directly downloaded remote URL in a new tab.
 * Defaults to true.
 * @param options.preferRemoteFetch - Fetch a remote URL as a blob before downloading it.
 * Defaults to true.
 */
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
  // One at a time, to avoid a burst of simultaneous requests.
  for (const attachment of attachments) {
    await downloadAttachment(attachment, {
      openRemoteInNewTab: true,
      preferRemoteFetch: true,
    });
  }
};
