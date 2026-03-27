import { prettifyFileSize } from '../../hooks/utils';

function safePrettifyFileSize(bytes: number, maximumFractionDigits?: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes === 0) return '0 B';
  return prettifyFileSize(bytes, maximumFractionDigits);
}

export function formatUploadByteFraction(
  uploadPercent: number,
  fullBytes: number,
  maximumFractionDigits?: number,
): string {
  const uploaded = Math.round((uploadPercent / 100) * fullBytes);
  return `${safePrettifyFileSize(uploaded, maximumFractionDigits)} / ${safePrettifyFileSize(fullBytes, maximumFractionDigits)}`;
}

export function resolveAttachmentFullByteSize(attachment: {
  file_size?: number | string;
  localMetadata?: { file?: { size?: unknown } } | null;
}): number | undefined {
  const fromFile = attachment.localMetadata?.file?.size;
  if (typeof fromFile === 'number' && Number.isFinite(fromFile) && fromFile >= 0) {
    return fromFile;
  }
  const raw = attachment.file_size;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return raw;
  if (typeof raw === 'string') {
    const n = parseFloat(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return undefined;
}
