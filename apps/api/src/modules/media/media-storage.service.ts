import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface StoredFileResult {
  objectKey: string;
  url: string;
}

@Injectable()
export class MediaStorageService {
  // ponytail: Local filesystem storage for dev/test; upgrade to S3 / Cloudflare R2 when S3_BUCKET is configured.
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    // Ensure upload dir exists
    fs.mkdir(this.uploadDir, { recursive: true }).catch(() => {
      // ignore
    });
  }

  async storeFile(params: {
    filename: string;
    extension: string;
    buffer: Buffer;
  }): Promise<StoredFileResult> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomId = crypto.randomUUID();
    const safeExt = params.extension.startsWith('.')
      ? params.extension
      : `.${params.extension}`;
    const objectKey = `uploads/${year}/${month}/${randomId}${safeExt}`;

    const fullPath = path.resolve(process.cwd(), objectKey);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, params.buffer);

    const url = `/api/v1/media/file/${objectKey}`;
    return { objectKey, url };
  }

  resolveFullPath(objectKey: string): string {
    const safeKey = objectKey.replace(/^(\.\.[/\\])+/, '');
    return path.resolve(process.cwd(), safeKey);
  }
}
