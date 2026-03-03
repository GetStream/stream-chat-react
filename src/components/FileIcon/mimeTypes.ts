export type GeneralType = 'audio/' | 'video/' | 'image/' | 'text/';

export type SupportedMimeType =
  | (typeof wordMimeTypes)[number]
  | (typeof excelMimeTypes)[number]
  | (typeof powerpointMimeTypes)[number]
  | (typeof archiveFileTypes)[number]
  | (typeof codeFileTypes)[number];

export const wordMimeTypes = [
  // Microsoft Word
  // .doc .dot
  'application/msword',
  // .doc .dot
  'application/msword-template',
  // .docx
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // .dotx (no test)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  // .docm
  'application/vnd.ms-word.document.macroEnabled.12',
  // .dotm (no test)
  'application/vnd.ms-word.template.macroEnabled.12',

  // LibreOffice/OpenOffice Writer
  // .odt
  'application/vnd.oasis.opendocument.text',
  // .ott
  'application/vnd.oasis.opendocument.text-template',
  // .fodt
  'application/vnd.oasis.opendocument.text-flat-xml',
  // .uot
  // NOTE: firefox doesn't know mimetype so maybe ignore
];

export const excelMimeTypes = [
  // .csv
  'text/csv',
  // TODO: maybe more data files

  // Microsoft Excel
  // .xls .xlt .xla (no test for .xla)
  'application/vnd.ms-excel',
  // .xlsx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // .xltx (no test)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  // .xlsm
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  // .xltm (no test)
  'application/vnd.ms-excel.template.macroEnabled.12',
  // .xlam (no test)
  'application/vnd.ms-excel.addin.macroEnabled.12',
  // .xlsb (no test)
  'application/vnd.ms-excel.addin.macroEnabled.12',

  // LibreOffice/OpenOffice Calc
  // .ods
  'application/vnd.oasis.opendocument.spreadsheet',
  // .ots
  'application/vnd.oasis.opendocument.spreadsheet-template',
  // .fods
  'application/vnd.oasis.opendocument.spreadsheet-flat-xml',
  // .uos
  // NOTE: firefox doesn't know mimetype so maybe ignore
];

export const powerpointMimeTypes = [
  // Microsoft Word
  // .ppt .pot .pps .ppa (no test for .ppa)
  'application/vnd.ms-powerpoint',
  // .pptx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // .potx (no test)
  'application/vnd.openxmlformats-officedocument.presentationml.template',
  // .ppsx
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  // .ppam
  'application/vnd.ms-powerpoint.addin.macroEnabled.12',
  // .pptm
  'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  // .potm
  'application/vnd.ms-powerpoint.template.macroEnabled.12',
  // .ppsm
  'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',

  // LibreOffice/OpenOffice Writer
  // .odp
  'application/vnd.oasis.opendocument.presentation',
  // .otp
  'application/vnd.oasis.opendocument.presentation-template',
  // .fodp
  'application/vnd.oasis.opendocument.presentation-flat-xml',
  // .uop
  // NOTE: firefox doesn't know mimetype so maybe ignore
];

export const archiveFileTypes = [
  // .zip
  'application/zip',
  // .z7
  'application/x-7z-compressed',
  // .ar
  'application/x-archive',
  // .tar
  'application/x-tar',
  // .tar.gz
  'application/gzip',
  // .tar.Z
  'application/x-compress',
  // .tar.bz2
  'application/x-bzip',
  // .tar.lz
  'application/x-lzip',
  // .tar.lz4
  'application/x-lz4',
  // .tar.lzma
  'application/x-lzma',
  // .tar.lzo (no test)
  'application/x-lzop',
  // .tar.xz
  'application/x-xz',
  // .war
  'application/x-webarchive',
  // .rar
  'application/vnd.rar',
];

export const codeFileTypes = [
  // .html .htm
  'text/html',
  // .css
  'text/css',
  // .js
  'application/x-javascript',
  'text/javascript',
  // .json
  'application/json',
  // .py
  'text/x-python',
  // .go
  'text/x-go',
  // .c
  'text/x-csrc',
  // .cpp
  'text/x-c++src',
  // .rb
  'application/x-ruby',
  // .rust
  'text/rust',
  // .java
  'text/x-java',
  // .php
  'application/x-php',
  // .cs
  'text/x-csharp',
  // .scala
  'text/x-scala',
  // .erl
  'text/x-erlang',
  // .sh
  'application/x-shellscript',
];

export const mimeTypeToExtensionMap: Record<string, string> = {
  // Application types (sorted alphabetically)
  'application/epub+zip': 'epub',
  'application/gzip': 'gz',
  'application/java-archive': 'jar',
  'application/json': 'json',
  'application/ld+json': 'jsonld',
  'application/msword': 'doc',
  'application/msword-template': 'dot',
  'application/octet-stream': 'bin',
  'application/ogg': 'ogx',
  'application/pdf': 'pdf',
  'application/postscript': 'ps',
  'application/rtf': 'rtf',
  'application/vnd.amazon.ebook': 'azw',
  'application/vnd.apple.installer+xml': 'mpkg',
  'application/vnd.mozilla.xul+xml': 'xul',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.ms-excel.addin.macroEnabled.12': 'xlam',
  'application/vnd.ms-excel.sheet.macroEnabled.12': 'xlsm',
  'application/vnd.ms-excel.template.macroEnabled.12': 'xltm',
  'application/vnd.ms-fontobject': 'eot',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.ms-powerpoint.addin.macroEnabled.12': 'ppam',
  'application/vnd.ms-powerpoint.presentation.macroEnabled.12': 'pptm',
  'application/vnd.ms-powerpoint.slideshow.macroEnabled.12': 'ppsm',
  'application/vnd.ms-powerpoint.template.macroEnabled.12': 'potm',
  'application/vnd.ms-word.document.macroEnabled.12': 'docm',
  'application/vnd.ms-word.template.macroEnabled.12': 'dotm',
  'application/vnd.oasis.opendocument.presentation': 'odp',
  'application/vnd.oasis.opendocument.presentation-flat-xml': 'fodp',
  'application/vnd.oasis.opendocument.presentation-template': 'otp',
  'application/vnd.oasis.opendocument.spreadsheet': 'ods',
  'application/vnd.oasis.opendocument.spreadsheet-flat-xml': 'fods',
  'application/vnd.oasis.opendocument.spreadsheet-template': 'ots',
  'application/vnd.oasis.opendocument.text': 'odt',
  'application/vnd.oasis.opendocument.text-flat-xml': 'fodt',
  'application/vnd.oasis.opendocument.text-template': 'ott',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow': 'ppsx',
  'application/vnd.openxmlformats-officedocument.presentationml.template': 'potx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template': 'xltx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template': 'dotx',
  'application/vnd.rar': 'rar',
  'application/vnd.visio': 'vsd',
  'application/wasm': 'wasm',
  'application/x-7z-compressed': '7z',
  'application/x-abiword': 'abw',
  'application/x-archive': 'ar',
  'application/x-bzip': 'bz',
  'application/x-bzip2': 'bz2',
  'application/x-cdf': 'cda',
  'application/x-compress': 'Z',
  'application/x-csh': 'csh',
  'application/x-dosexec': 'exe',
  'application/x-freearc': 'arc',
  'application/x-httpd-php': 'php',
  'application/x-iso9660-image': 'iso',
  'application/x-javascript': 'js',
  'application/x-lz4': 'lz4',
  'application/x-lzip': 'lz',
  'application/x-lzma': 'lzma',
  'application/x-lzop': 'lzo',
  'application/x-mobipocket-ebook': 'mobi',
  'application/x-msdownload': 'exe',
  'application/x-perl': 'pl',
  'application/x-php': 'php',
  'application/x-rar-compressed': 'rar',
  'application/x-ruby': 'rb',
  'application/x-sh': 'sh',
  'application/x-shellscript': 'sh',
  'application/x-shockwave-flash': 'swf',
  'application/x-sql': 'sql',
  'application/x-stuffit': 'sit',
  'application/x-tar': 'tar',
  'application/x-webarchive': 'war',
  'application/x-xz': 'xz',
  'application/x-yaml': 'yaml',
  'application/xhtml+xml': 'xhtml',
  'application/xml': 'xml',
  'application/zip': 'zip',

  // Audio types
  'audio/aac': 'aac',
  'audio/flac': 'flac',
  'audio/midi': 'midi',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'oga',
  'audio/opus': 'opus',
  'audio/wav': 'wav',
  'audio/webm': 'weba',
  'audio/x-aiff': 'aiff',
  'audio/x-m4a': 'm4a',
  'audio/x-midi': 'midi',
  'audio/x-ms-wma': 'wma',
  'audio/x-wav': 'wav',

  // Font types
  'font/otf': 'otf',
  'font/ttf': 'ttf',
  'font/woff': 'woff',
  'font/woff2': 'woff2',

  // Image types
  'image/apng': 'apng',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/tiff': 'tiff',
  'image/vnd.microsoft.icon': 'ico',
  'image/webp': 'webp',
  'image/x-icon': 'ico',

  // Text types
  'text/calendar': 'ics',
  'text/css': 'css',
  'text/csv': 'csv',
  'text/html': 'html',
  'text/javascript': 'js',
  'text/markdown': 'md',
  'text/plain': 'txt',
  'text/rtf': 'rtf',
  'text/rust': 'rs',
  'text/tab-separated-values': 'tsv',
  'text/vcard': 'vcf',
  'text/x-c': 'c',
  'text/x-c++src': 'cpp',
  'text/x-csharp': 'cs',
  'text/x-csrc': 'c',
  'text/x-diff': 'diff',
  'text/x-erlang': 'erl',
  'text/x-go': 'go',
  'text/x-java': 'java',
  'text/x-java-source': 'java',
  'text/x-kotlin': 'kt',
  'text/x-lua': 'lua',
  'text/x-markdown': 'md',
  'text/x-objectivec': 'm',
  'text/x-pascal': 'pas',
  'text/x-perl': 'pl',
  'text/x-python': 'py',
  'text/x-ruby': 'rb',
  'text/x-rust': 'rs',
  'text/x-scala': 'scala',
  'text/x-sh': 'sh',
  'text/x-shellscript': 'sh',
  'text/x-sql': 'sql',
  'text/x-swift': 'swift',
  'text/x-typescript': 'ts',
  'text/x-yaml': 'yaml',
  'text/xml': 'xml',
  'text/yaml': 'yaml',

  // Video types
  'video/3gpp': '3gp',
  'video/3gpp2': '3g2',
  'video/mp2t': 'ts',
  'video/mp4': 'mp4',
  'video/mpeg': 'mpeg',
  'video/ogg': 'ogv',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-flv': 'flv',
  'video/x-m4v': 'm4v',
  'video/x-matroska': 'mkv',
  'video/x-ms-wmv': 'wmv',
  'video/x-msvideo': 'avi',
};
