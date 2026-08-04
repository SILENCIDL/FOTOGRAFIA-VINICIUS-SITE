/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly DATABASE_SSL: string;
  readonly JWT_SECRET: string;
  readonly APP_ENCRYPTION_KEY: string;
  readonly UPLOAD_DIR: string;
  readonly MAX_FILE_SIZE_MB: string;
  readonly ALLOWED_MIME_TYPES: string;
  readonly NODE_ENV: string;
  readonly PORT: string;
  readonly PUBLIC_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
